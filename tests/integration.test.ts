import { beforeAll, describe, expect, jest, test } from '@jest/globals'
import { createServer } from 'node:net'
import { MetacriticService, RecordType } from '../src'
import { classifyError } from '@deadlock-too/scrape-kit'

/** Reserves an ephemeral loopback port and immediately gives it back up. */
function closedLoopbackPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (address === null || typeof address === 'string') {
        return reject(new Error('expected a TCP address'))
      }
      server.close(() => resolve(address.port))
    })
  })
}

// These hit the live backend, so they need more headroom than Jest's 5s
// default: the HTTP client alone allows 60s per attempt plus two retries with
// backoff, so one slow response would fail the test long before the client
// would have recovered from it.
//
// This has to live here rather than as `testTimeout` in jest.config.ts: in a
// multi-project config Jest resolves a project-level `testTimeout` (it shows up
// in `--showConfig`) but does not apply it at runtime, so the 5s default wins
// silently. Setting it at the top level of the config would work, but would
// also relax the unit suite.
jest.setTimeout(30_000)

// These tests hit the live Metacritic backend. They run only via the scheduled
// CI workflow (`npm run test:integration`), not as part of `npm test`.
//
// One service instance is shared across the suite to keep the request volume
// against Metacritic's edge as low as the suite allows.
let service: MetacriticService

beforeAll(() => {
  service = new MetacriticService()
})

describe('Integration – MetacriticService search', () => {
  test('searches game data on Metacritic', async () => {
    const result = await service.search('Elden Ring', { recordType: RecordType.Game })
    expect(result.success).toBe(true)
    if (!result.success) throw new Error(result.error)

    const entry = result.data[0]
    expect(entry.recordType).toBe(RecordType.Game)
    expect(entry.title).toBe('Elden Ring')
    expect(entry.slug).toBe('elden-ring')
    expect(entry.criticScoreValue).toBeGreaterThan(90)
    expect(entry.similarity).toBe(1)
  })

  test('searches TV show data on Metacritic', async () => {
    const result = await service.search('Breaking Bad', { recordType: RecordType.TVShow })
    expect(result.success).toBe(true)
    if (!result.success) throw new Error(result.error)
    expect(result.data[0].recordType).toBe(RecordType.TVShow)
    expect(result.data[0].title).toBe('Breaking Bad')
  })

  test('returns an empty result set for an unknown title', async () => {
    const result = await service.search('ThisGameDoesNotExistAndShouldNotBeFound', {
      recordType: RecordType.Game,
    })
    expect(result.success).toBe(true)
    if (!result.success) throw new Error(result.error)
    expect(result.data).toHaveLength(0)
  })
})

describe('Integration – MetacriticService getDetail', () => {
  test('fetches game detail from Metacritic', async () => {
    const result = await service.getDetail('Elden Ring', RecordType.Game)
    expect(result.success).toBe(true)
    if (!result.success) throw new Error(result.error)
    expect(result.data).not.toBeNull()

    const entry = result.data!
    expect(entry.title).toBe('Elden Ring')
    expect(entry.slug).toBe('elden-ring')
    expect(entry.criticScore.maxScore).toBe(100)
    expect(entry.criticScore.score).toBeGreaterThan(90)
    expect(entry.userScore.maxScore).toBe(10)
    expect(entry.userScore.count.total).toBeGreaterThan(0)
  })

  test('fails when no entry matches', async () => {
    const result = await service.getDetail('ThisGameDoesNotExistAndShouldNotBeFound', RecordType.Game)
    expect(result).toEqual({ success: false, error: 'No matching entry found', kind: 'notFound' })
  })
})

// The unit suite classifies hand-built doubles of the errors `fetch` throws.
// These check the doubles are faithful, by classifying the errors the runtime
// actually produces.
describe('Integration – failure classification', () => {
  test('a real refused connection classifies as transport', async () => {
    // Bind a port, then release it, so the connect is refused for certain.
    // Hard-coding a "probably closed" port risks either a live listener or one
    // of the ports undici blocks outright, which is a different failure.
    const port = await closedLoopbackPort()

    let thrown: unknown
    try {
      await fetch(`http://127.0.0.1:${port}/`)
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeDefined()
    expect(classifyError(thrown)).toEqual({ kind: 'transport' })
  })

  test('a real elapsed deadline classifies as timeout, not as a parse failure', async () => {
    const impatient = new MetacriticService({ timeout: 1, retries: 0 })
    const result = await impatient.search('Elden Ring', { recordType: RecordType.Game })

    expect(result.success).toBe(false)
    if (result.success) throw new Error('expected failure')
    expect(result.kind).toBe('timeout')
    expect(result.error).toBe('The Metacritic request timed out')
  })

  test('a real caller abort classifies as aborted', async () => {
    const controller = new AbortController()
    const promise = service.search('Elden Ring', { recordType: RecordType.Game, signal: controller.signal })
    controller.abort()

    const result = await promise
    expect(result.success).toBe(false)
    if (result.success) throw new Error('expected failure')
    expect(result.kind).toBe('aborted')
  })
})
