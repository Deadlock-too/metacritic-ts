import { describe, expect, test } from '@jest/globals'
import { readFileSync } from 'node:fs'
import { MetacriticService, RecordType, ScraperError } from '../src'
import { getMatchScore, getSimilarity } from '../src/lib/utils'
import { parseDetailJsonResult, parseSearchJsonResult } from '../src/lib/parser'
import { HttpClient, type FetchLike } from '../src/core/http'
import { clampSimilarity } from '../src/core/options'

const searchFixture = readFileSync('tests/fixtures/search-response.json', 'utf8')
const detailFixture = readFileSync('tests/fixtures/detail-response.json', 'utf8')

const HOMEPAGE_HTML = '<html><body><script>boot({"u":"/api?apiKey=KEY_123&v=2"})</script></body></html>'

const isHomepage = (u: string) => u.startsWith('https://www.metacritic.com')
const isSearch = (u: string) => u.includes('backend.metacritic.com') && u.includes('/search/')
const isDetail = (u: string) => u.includes('backend.metacritic.com') && !u.includes('/search/')

type Handler = (url: string) => Response

function makeService(handler: Handler, counters?: { homepage?: number; search?: number; detail?: number }) {
  const fetchFn: FetchLike = async (input) => {
    const url = String(input)
    if (counters) {
      if (isHomepage(url)) counters.homepage = (counters.homepage ?? 0) + 1
      else if (isSearch(url)) counters.search = (counters.search ?? 0) + 1
      else if (isDetail(url)) counters.detail = (counters.detail ?? 0) + 1
    }
    return handler(url)
  }
  return new MetacriticService({ fetch: fetchFn, retries: 0 })
}

const happyHandler =
  (search = searchFixture, detail = detailFixture): Handler =>
  (url) => {
    if (isHomepage(url)) return new Response(HOMEPAGE_HTML)
    if (isSearch(url)) return new Response(search)
    return new Response(detail)
  }

describe('MetacriticService – search', () => {
  test('rejects an empty search key', async () => {
    const result = await new MetacriticService().search('')
    expect(result).toEqual({ success: false, error: 'Search key is required' })
  })

  test('returns parsed, similarity-sorted results', async () => {
    const result = await makeService(happyHandler()).search('The Last of Us')
    expect(result.success).toBe(true)
    if (!result.success) throw new Error('expected success')
    // "Completely Unrelated Movie" is filtered out by the threshold.
    expect(result.data.map((e) => e.id)).toEqual([2001, 1001, 1002])
    expect(result.data[0].criticScoreValue).toBe(84)
    expect(result.data[0].must).toBe(true)
  })

  test('can leave the API ordering untouched', async () => {
    const result = await makeService(happyHandler()).search('The Last of Us', { sortBySimilarity: false })
    expect(result.success).toBe(true)
    if (!result.success) throw new Error('expected success')
    expect(result.data.map((e) => e.id)).toEqual([1001, 1002, 2001])
  })

  test('fails clearly when the API key cannot be retrieved', async () => {
    const result = await makeService((url) =>
      isHomepage(url) ? new Response('', { status: 404 }) : new Response(searchFixture),
    ).search('The Last of Us')
    expect(result).toEqual({ success: false, error: 'Failed to retrieve API key' })
  })

  test('surfaces a clear error when the response shape changed', async () => {
    const result = await makeService((url) =>
      isHomepage(url) ? new Response(HOMEPAGE_HTML) : new Response(JSON.stringify({ components: [] })),
    ).search('The Last of Us')
    expect(result.success).toBe(false)
    if (result.success) throw new Error('expected failure')
    expect(result.error).toMatch(/structure may have changed/)
  })
})

describe('MetacriticService – API key handling', () => {
  test('shares a single API-key request across concurrent calls', async () => {
    const counters: { homepage?: number } = {}
    const service = makeService(happyHandler(), counters)
    await Promise.all([service.search('The Last of Us'), service.search('The Last of Us')])
    expect(counters.homepage).toBe(1)
  })

  test('refreshes the API key after an auth failure and retries', async () => {
    const counters: { homepage?: number } = {}
    let searchCalls = 0
    const service = makeService((url) => {
      if (isHomepage(url)) return new Response(HOMEPAGE_HTML)
      if (isSearch(url)) {
        searchCalls++
        return searchCalls === 1 ? new Response('', { status: 403 }) : new Response(searchFixture)
      }
      return new Response(detailFixture)
    }, counters)

    const result = await service.search('The Last of Us')
    expect(result.success).toBe(true)
    expect(searchCalls).toBe(2)
    expect(counters.homepage).toBe(2) // initial + forced refresh
  })
})

describe('MetacriticService – getDetail', () => {
  test('returns the detail for the best match', async () => {
    const result = await makeService(happyHandler()).getDetail('The Last of Us Part II', RecordType.Game)
    expect(result.success).toBe(true)
    if (!result.success) throw new Error('expected success')
    expect(result.data?.title).toBe('The Last of Us Part II')
    expect(result.data?.criticScore.score).toBe(93)
    expect(result.data?.criticScore.count.total).toBe(126)
    expect(result.data?.userScore.sentiment).toBe('mixed')
  })

  test('fails when no entry matches', async () => {
    const empty = JSON.stringify({ components: [{ meta: { componentName: 'search' }, data: { items: [] } }] })
    const result = await makeService(happyHandler(empty)).getDetail('Nothing Here', RecordType.Game)
    expect(result).toEqual({ success: false, error: 'No matching entry found' })
  })

  test('fails clearly on an unsupported record type', async () => {
    const result = await makeService(happyHandler()).getDetail('The Last of Us Part II', 99 as RecordType)
    expect(result.success).toBe(false)
    if (result.success) throw new Error('expected failure')
    expect(result.error).toMatch(/Unsupported record type/)
  })
})

describe('parser', () => {
  test('maps search items into typed entries', () => {
    const entries = parseSearchJsonResult(searchFixture, 'The Last of Us', 0.5)
    expect(entries[0]).toMatchObject({ id: 2001, recordType: RecordType.TVShow, must: true, criticScoreValue: 84 })
    expect(entries[0].similarity).toBe(1)
  })

  test('throws a ScraperError on invalid JSON', () => {
    expect(() => parseSearchJsonResult('{ not json }', 'x', 0.5)).toThrow(ScraperError)
  })

  test('throws a ScraperError when a component is missing', () => {
    expect(() => parseDetailJsonResult(JSON.stringify({ components: [] }), true)).toThrow(/structure may have changed/)
  })

  test('maps the detail payload into score objects', () => {
    const entry = parseDetailJsonResult(detailFixture, true)
    expect(entry.criticScore.maxScore).toBe(100)
    expect(entry.userScore.count.negative).toBe(30000)
    expect(entry.must).toBe(true)
  })
})

describe('HttpClient', () => {
  test('retries on 429 then succeeds', async () => {
    let calls = 0
    const fetchFn: FetchLike = async () => {
      calls++
      return calls === 1 ? new Response('', { status: 429, headers: { 'retry-after': '0' } }) : new Response('ok')
    }
    const response = await new HttpClient({ fetch: fetchFn, retries: 2, retryDelay: 1 }).request('https://example.com')
    expect(calls).toBe(2)
    expect(await response.text()).toBe('ok')
  })

  test('retries network errors then throws', async () => {
    let calls = 0
    const fetchFn: FetchLike = async () => {
      calls++
      throw new Error('boom')
    }
    await expect(
      new HttpClient({ fetch: fetchFn, retries: 1, retryDelay: 1 }).request('https://example.com'),
    ).rejects.toThrow('boom')
    expect(calls).toBe(2)
  })

  test('does not retry once the caller aborts', async () => {
    let calls = 0
    const fetchFn: FetchLike = async (_input, init) => {
      calls++
      if (init?.signal?.aborted) throw new Error('aborted')
      return new Response('ok')
    }
    const controller = new AbortController()
    controller.abort()
    await expect(
      new HttpClient({ fetch: fetchFn, retries: 3, retryDelay: 1 }).request(
        'https://example.com',
        {},
        controller.signal,
      ),
    ).rejects.toThrow()
    expect(calls).toBe(1)
  })

  test('injects a random User-Agent when none is supplied', async () => {
    let seen: Headers | undefined
    const fetchFn: FetchLike = async (_input, init) => {
      seen = new Headers(init?.headers)
      return new Response('ok')
    }
    await new HttpClient({ fetch: fetchFn, retries: 0 }).request('https://example.com')
    expect(seen?.get('User-Agent')).toBeTruthy()
  })
})

describe('utils', () => {
  test('getSimilarity matches documented values', () => {
    expect(getSimilarity('test', 'test')).toBe(1)
    expect(getSimilarity('test', 'banana')).toBe(0)
    expect(getSimilarity('Elden Ring', 'Elden Rin')).toBe(0.9)
  })

  test('getMatchScore keeps short queries against long titles', () => {
    expect(getMatchScore('The Last of Us Part II', 'The Last of Us')).toBeGreaterThanOrEqual(0.5)
  })

  test('clampSimilarity keeps values within [0, 1]', () => {
    expect(clampSimilarity(-1)).toBe(0)
    expect(clampSimilarity(5)).toBe(1)
    expect(clampSimilarity(Number.NaN)).toBe(0.5)
  })
})
