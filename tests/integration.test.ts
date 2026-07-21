import { beforeAll, describe, expect, jest, test } from '@jest/globals'
import { MetacriticService, RecordType } from '../src'

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
// A single service instance is shared across the suite on purpose: the service
// caches the Metacritic API key per instance, so reusing it scrapes the
// homepage once instead of once per test. Spinning up a fresh service for every
// test fired a burst of homepage requests that Metacritic's edge rate-limited on
// CI, surfacing as flaky "Failed to retrieve API key" failures.
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
    expect(result).toEqual({ success: false, error: 'No matching entry found' })
  })
})
