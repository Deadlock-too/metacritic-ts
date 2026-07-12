import { describe, expect, test } from '@jest/globals'
import { MetacriticService, RecordType } from '../src'

// These tests hit the live Metacritic backend. They run only via the scheduled
// CI workflow (`npm run test:integration`), not as part of `npm test`.
describe('Integration – MetacriticService search', () => {
  test('searches game data on Metacritic', async () => {
    const result = await new MetacriticService().search('Elden Ring', { recordType: RecordType.Game })
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
    const result = await new MetacriticService().search('Breaking Bad', { recordType: RecordType.TVShow })
    expect(result.success).toBe(true)
    if (!result.success) throw new Error(result.error)
    expect(result.data[0].recordType).toBe(RecordType.TVShow)
    expect(result.data[0].title).toBe('Breaking Bad')
  })

  test('returns an empty result set for an unknown title', async () => {
    const result = await new MetacriticService().search('ThisGameDoesNotExistAndShouldNotBeFound', {
      recordType: RecordType.Game,
    })
    expect(result.success).toBe(true)
    if (!result.success) throw new Error(result.error)
    expect(result.data).toHaveLength(0)
  })
})

describe('Integration – MetacriticService getDetail', () => {
  test('fetches game detail from Metacritic', async () => {
    const result = await new MetacriticService().getDetail('Elden Ring', RecordType.Game)
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
    const result = await new MetacriticService().getDetail('ThisGameDoesNotExistAndShouldNotBeFound', RecordType.Game)
    expect(result).toEqual({ success: false, error: 'No matching entry found' })
  })
})
