import { describe } from '@jest/globals'
import { MetacriticService, RecordType } from '../src'

describe('Integration-Testing MetacriticService Search', () => {
  test('should search game data on Metacritic', async () => {
    const service = new MetacriticService()
    const gameName = 'Elden Ring'
    const metacriticEntries = await service.search(gameName)

    expect(metacriticEntries).toBeDefined()
    expect(metacriticEntries.length).toBeGreaterThan(0)
    expect(metacriticEntries[0].id).toBe(1300501979)
    expect(metacriticEntries[0].recordType).toBe(RecordType.Game)
    expect(metacriticEntries[0].title).toBe(gameName)
    expect(metacriticEntries[0].slug).toBe('elden-ring')
    expect(metacriticEntries[0].must).toBe(true)
    expect(metacriticEntries[0].criticScore).toBeGreaterThan(90)
    expect(metacriticEntries[0].similarity).toBe(1)
  })

  test('should not find any game on Metacritic', async () => {
    const service = new MetacriticService()
    const gameName = 'ThisGameDoesNotExistAndShouldNotBeFound'
    const metacriticEntries = await service.search(gameName)

    expect(metacriticEntries).toBeDefined()
    expect(metacriticEntries).toHaveLength(0)
  })

  test('should search TV show data on Metacritic', async () => {
    const service = new MetacriticService()
    const tvShowName = 'Breaking Bad'
    const metacriticEntries = await service.search(tvShowName, RecordType.TVShow)

    expect(metacriticEntries).toBeDefined()
    expect(metacriticEntries.length).toBeGreaterThan(0)
    expect(metacriticEntries[0].id).toBe(1000303212)
    expect(metacriticEntries[0].recordType).toBe(RecordType.TVShow)
    expect(metacriticEntries[0].title).toBe(tvShowName)
    expect(metacriticEntries[0].slug).toBe('breaking-bad')
    expect(metacriticEntries[0].must).toBe(true)
    expect(metacriticEntries[0].criticScore).toBeGreaterThan(85)
    expect(metacriticEntries[0].similarity).toBe(1)
  })

  test('should not find any TV show on Metacritic', async () => {
    const service = new MetacriticService()
    const tvShowName = 'ThisTVShowDoesNotExistAndShouldNotBeFound'
    const metacriticEntries = await service.search(tvShowName, RecordType.TVShow)

    expect(metacriticEntries).toBeDefined()
    expect(metacriticEntries).toHaveLength(0)
  })

  test('should search movie data on Metacritic', async () => {
    const service = new MetacriticService()
    const movieName = '2001: A Space Odyssey'
    const metacriticEntries = await service.search(movieName, RecordType.Movie)

    expect(metacriticEntries).toBeDefined()
    expect(metacriticEntries.length).toBeGreaterThan(0)
    expect(metacriticEntries[0].id).toBe(2000521820)
    expect(metacriticEntries[0].recordType).toBe(RecordType.Movie)
    expect(metacriticEntries[0].title).toBe(movieName)
    expect(metacriticEntries[0].slug).toBe('2001-a-space-odyssey')
    expect(metacriticEntries[0].must).toBe(true)
    expect(metacriticEntries[0].criticScore).toBeGreaterThan(80)
    expect(metacriticEntries[0].similarity).toBe(1)
  })

  test('should not find any movie on Metacritic', async () => {
    const service = new MetacriticService()
    const movieName = 'ThisMovieDoesNotExistAndShouldNotBeFound'
    const metacriticEntries = await service.search(movieName, RecordType.Movie)

    expect(metacriticEntries).toBeDefined()
    expect(metacriticEntries).toHaveLength(0)
  })
})

describe('Integration-Testing MetacriticService Detail', () => {
  test('should fetch game detail from Metacritic', async () => {
    const service = new MetacriticService()
    const gameName = 'Elden Ring'
    const metacriticEntry = await service.getDetail(gameName, RecordType.Game)

    expect(metacriticEntry).toBeDefined()

    expect(metacriticEntry!.id).toBe(1300501979)
    expect(metacriticEntry!.recordType).toBe(RecordType.Game)
    expect(metacriticEntry!.title).toBe(gameName)
    expect(metacriticEntry!.slug).toBe('elden-ring')
    expect(metacriticEntry!.must).toBe(true)
    expect(metacriticEntry!.userScore.maxScore).toBe(10)
    expect(metacriticEntry!.userScore.sentiment).toBe('Generally favorable')
    expect(metacriticEntry!.userScore.score).toBeGreaterThan(8)
    expect(metacriticEntry!.userScore.count.positive).toBeGreaterThan(15000)
    expect(metacriticEntry!.userScore.count.neutral).toBeGreaterThan(1000)
    expect(metacriticEntry!.userScore.count.negative).toBeGreaterThan(2500)
    expect(metacriticEntry!.userScore.count.total).toBeGreaterThan(18500)
    expect(metacriticEntry!.criticScore.maxScore).toBe(100)
    expect(metacriticEntry!.criticScore.sentiment).toBe('Universal acclaim')
    expect(metacriticEntry!.criticScore.score).toBeGreaterThan(90)
    expect(metacriticEntry!.criticScore.count.positive).toBeGreaterThan(75)
    expect(metacriticEntry!.criticScore.count.neutral).toBe(0)
    expect(metacriticEntry!.criticScore.count.negative).toBe(0)
    expect(metacriticEntry!.criticScore.count.total).toBeGreaterThan(75)
  })

  test('should not find any game detail on Metacritic', async () => {
    const service = new MetacriticService()
    const gameName = 'ThisGameDoesNotExistAndShouldNotBeFound'
    const metacriticEntry = await service.getDetail(gameName, RecordType.Game)

    expect(metacriticEntry).toBeNull()
  })

  test('should fetch TV show detail from Metacritic', async () => {
    const service = new MetacriticService()
    const tvShowName = 'Breaking Bad'
    const metacriticEntry = await service.getDetail(tvShowName, RecordType.TVShow)

    expect(metacriticEntry).toBeDefined()

    expect(metacriticEntry!.id).toBe(1000303212)
    expect(metacriticEntry!.recordType).toBe(RecordType.TVShow)
    expect(metacriticEntry!.title).toBe(tvShowName)
    expect(metacriticEntry!.slug).toBe('breaking-bad')
    expect(metacriticEntry!.must).toBe(true)
    expect(metacriticEntry!.userScore.maxScore).toBe(10)
    expect(metacriticEntry!.userScore.sentiment).toBe('Universal acclaim')
    expect(metacriticEntry!.userScore.score).toBeGreaterThan(9)
    expect(metacriticEntry!.userScore.count.positive).toBeGreaterThan(15000)
    expect(metacriticEntry!.userScore.count.neutral).toBeGreaterThan(200)
    expect(metacriticEntry!.userScore.count.negative).toBeGreaterThan(400)
    expect(metacriticEntry!.userScore.count.total).toBeGreaterThan(15600)
    expect(metacriticEntry!.criticScore.maxScore).toBe(100)
    expect(metacriticEntry!.criticScore.sentiment).toBe('Universal acclaim')
    expect(metacriticEntry!.criticScore.score).toBeGreaterThan(80)
    expect(metacriticEntry!.criticScore.count.positive).toBeGreaterThan(90)
    expect(metacriticEntry!.criticScore.count.neutral).toBeGreaterThan(0)
    expect(metacriticEntry!.criticScore.count.negative).toBe(0)
    expect(metacriticEntry!.criticScore.count.total).toBeGreaterThan(90)
  })

  test('should not find any TV show detail on Metacritic', async () => {
    const service = new MetacriticService()
    const tvShowName = 'ThisTVShowDoesNotExistAndShouldNotBeFound'
    const metacriticEntry = await service.getDetail(tvShowName, RecordType.TVShow)

    expect(metacriticEntry).toBeNull()
  })

  test('should fetch movie detail from Metacritic', async () => {
    const service = new MetacriticService()
    const movieName = '2001: A Space Odyssey'
    const metacriticEntry = await service.getDetail(movieName, RecordType.Movie)

    expect(metacriticEntry).toBeDefined()

    expect(metacriticEntry!.id).toBe(2000521820)
    expect(metacriticEntry!.recordType).toBe(RecordType.Movie)
    expect(metacriticEntry!.title).toBe(movieName)
    expect(metacriticEntry!.slug).toBe('2001-a-space-odyssey')
    expect(metacriticEntry!.must).toBe(true)
    expect(metacriticEntry!.userScore.maxScore).toBe(10)
    expect(metacriticEntry!.userScore.sentiment).toBe('Universal acclaim')
    expect(metacriticEntry!.userScore.score).toBeGreaterThan(8.5)
    expect(metacriticEntry!.userScore.count.positive).toBeGreaterThan(1000)
    expect(metacriticEntry!.userScore.count.neutral).toBeGreaterThan(75)
    expect(metacriticEntry!.userScore.count.negative).toBeGreaterThan(50)
    expect(metacriticEntry!.userScore.count.total).toBeGreaterThan(1125)
    expect(metacriticEntry!.criticScore.maxScore).toBe(100)
    expect(metacriticEntry!.criticScore.sentiment).toBe('Universal acclaim')
    expect(metacriticEntry!.criticScore.score).toBeGreaterThan(80)
    expect(metacriticEntry!.criticScore.count.positive).toBeGreaterThan(15)
    expect(metacriticEntry!.criticScore.count.neutral).toBeGreaterThan(2)
    expect(metacriticEntry!.criticScore.count.negative).toBeGreaterThan(1)
    expect(metacriticEntry!.criticScore.count.total).toBeGreaterThan(18)
  })

  test('should not find any movie detail on Metacritic', async () => {
    const service = new MetacriticService()
    const movieName = 'ThisMovieDoesNotExistAndShouldNotBeFound'
    const metacriticEntry = await service.getDetail(movieName, RecordType.Movie)

    expect(metacriticEntry).toBeNull()
  })
})
