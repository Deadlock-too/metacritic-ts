import { describe } from '@jest/globals'
import { MetacriticService, RecordType } from '../src'

describe('Integration-Testing MetacriticService Search', () => {
  test('should search game data on Metacritic', async () => {
    const service = new MetacriticService()
    const gameName = 'Elden Ring'
    const result = await service.search(gameName)

    expect(result.success).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.data[0].id).toBe(1300501979)
    expect(result.data[0].recordType).toBe(RecordType.Game)
    expect(result.data[0].title).toBe(gameName)
    expect(result.data[0].slug).toBe('elden-ring')
    expect(result.data[0].must).toBe(true)
    expect(result.data[0].criticScore).toBeGreaterThan(90)
    expect(result.data[0].similarity).toBe(1)
  })

  test('should not find any game on Metacritic', async () => {
    const service = new MetacriticService()
    const gameName = 'ThisGameDoesNotExistAndShouldNotBeFound'
    const result = await service.search(gameName)

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(0)
  })

  test('should search TV show data on Metacritic', async () => {
    const service = new MetacriticService()
    const tvShowName = 'Breaking Bad'
    const result = await service.search(tvShowName, RecordType.TVShow)

    expect(result.success).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.data[0].id).toBe(1000303212)
    expect(result.data[0].recordType).toBe(RecordType.TVShow)
    expect(result.data[0].title).toBe(tvShowName)
    expect(result.data[0].slug).toBe('breaking-bad')
    expect(result.data[0].must).toBe(true)
    expect(result.data[0].criticScore).toBeGreaterThan(85)
    expect(result.data[0].similarity).toBe(1)
  })

  test('should not find any TV show on Metacritic', async () => {
    const service = new MetacriticService()
    const tvShowName = 'ThisTVShowDoesNotExistAndShouldNotBeFound'
    const result = await service.search(tvShowName, RecordType.TVShow)

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(0)
  })

  test('should search movie data on Metacritic', async () => {
    const service = new MetacriticService()
    const movieName = '2001: A Space Odyssey'
    const result = await service.search(movieName, RecordType.Movie)

    expect(result.success).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.data[0].id).toBe(2000521820)
    expect(result.data[0].recordType).toBe(RecordType.Movie)
    expect(result.data[0].title).toBe(movieName)
    expect(result.data[0].slug).toBe('2001-a-space-odyssey')
    expect(result.data[0].must).toBe(true)
    expect(result.data[0].criticScore).toBeGreaterThan(80)
    expect(result.data[0].similarity).toBe(1)
  })

  test('should not find any movie on Metacritic', async () => {
    const service = new MetacriticService()
    const movieName = 'ThisMovieDoesNotExistAndShouldNotBeFound'
    const result = await service.search(movieName, RecordType.Movie)

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(0)
  })
})

describe('Integration-Testing MetacriticService Detail', () => {
  test('should fetch game detail from Metacritic', async () => {
    const service = new MetacriticService()
    const gameName = 'Elden Ring'
    const result = await service.getDetail(gameName, RecordType.Game)

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()

    expect(result.data!.id).toBe(1300501979)
    expect(result.data!.recordType).toBe(RecordType.Game)
    expect(result.data!.title).toBe(gameName)
    expect(result.data!.slug).toBe('elden-ring')
    expect(result.data!.must).toBe(true)
    expect(result.data!.userScore.maxScore).toBe(10)
    expect(result.data!.userScore.sentiment).toBe('Generally favorable')
    expect(result.data!.userScore.score).toBeGreaterThan(8)
    expect(result.data!.userScore.count.positive).toBeGreaterThan(15000)
    expect(result.data!.userScore.count.neutral).toBeGreaterThan(1000)
    expect(result.data!.userScore.count.negative).toBeGreaterThan(2500)
    expect(result.data!.userScore.count.total).toBeGreaterThan(18500)
    expect(result.data!.criticScore.maxScore).toBe(100)
    expect(result.data!.criticScore.sentiment).toBe('Universal acclaim')
    expect(result.data!.criticScore.score).toBeGreaterThan(90)
    expect(result.data!.criticScore.count.positive).toBeGreaterThan(75)
    expect(result.data!.criticScore.count.neutral).toBe(0)
    expect(result.data!.criticScore.count.negative).toBe(0)
    expect(result.data!.criticScore.count.total).toBeGreaterThan(75)
  })

  test('should not find any game detail on Metacritic', async () => {
    const service = new MetacriticService()
    const gameName = 'ThisGameDoesNotExistAndShouldNotBeFound'
    const result = await service.getDetail(gameName, RecordType.Game)

    expect(result.success).toBe(false)
    expect(result.data).toBeNull()
    expect(result.error).toBe('No matching entry found')
  })

  test('should fetch TV show detail from Metacritic', async () => {
    const service = new MetacriticService()
    const tvShowName = 'Breaking Bad'
    const result = await service.getDetail(tvShowName, RecordType.TVShow)

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()

    expect(result.data!.id).toBe(1000303212)
    expect(result.data!.recordType).toBe(RecordType.TVShow)
    expect(result.data!.title).toBe(tvShowName)
    expect(result.data!.slug).toBe('breaking-bad')
    expect(result.data!.must).toBe(true)
    expect(result.data!.userScore.maxScore).toBe(10)
    expect(result.data!.userScore.sentiment).toBe('Universal acclaim')
    expect(result.data!.userScore.score).toBeGreaterThan(9)
    expect(result.data!.userScore.count.positive).toBeGreaterThan(15000)
    expect(result.data!.userScore.count.neutral).toBeGreaterThan(200)
    expect(result.data!.userScore.count.negative).toBeGreaterThan(400)
    expect(result.data!.userScore.count.total).toBeGreaterThan(15600)
    expect(result.data!.criticScore.maxScore).toBe(100)
    expect(result.data!.criticScore.sentiment).toBe('Universal acclaim')
    expect(result.data!.criticScore.score).toBeGreaterThan(80)
    expect(result.data!.criticScore.count.positive).toBeGreaterThan(90)
    expect(result.data!.criticScore.count.neutral).toBeGreaterThan(0)
    expect(result.data!.criticScore.count.negative).toBe(0)
    expect(result.data!.criticScore.count.total).toBeGreaterThan(90)
  })

  test('should not find any TV show detail on Metacritic', async () => {
    const service = new MetacriticService()
    const tvShowName = 'ThisTVShowDoesNotExistAndShouldNotBeFound'
    const result = await service.getDetail(tvShowName, RecordType.TVShow)

    expect(result.success).toBe(false)
    expect(result.data).toBeNull()
    expect(result.error).toBe('No matching entry found')
  })

  test('should fetch movie detail from Metacritic', async () => {
    const service = new MetacriticService()
    const movieName = '2001: A Space Odyssey'
    const result = await service.getDetail(movieName, RecordType.Movie)

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()

    expect(result.data!.id).toBe(2000521820)
    expect(result.data!.recordType).toBe(RecordType.Movie)
    expect(result.data!.title).toBe(movieName)
    expect(result.data!.slug).toBe('2001-a-space-odyssey')
    expect(result.data!.must).toBe(true)
    expect(result.data!.userScore.maxScore).toBe(10)
    expect(result.data!.userScore.sentiment).toBe('Universal acclaim')
    expect(result.data!.userScore.score).toBeGreaterThan(8.5)
    expect(result.data!.userScore.count.positive).toBeGreaterThan(1000)
    expect(result.data!.userScore.count.neutral).toBeGreaterThan(75)
    expect(result.data!.userScore.count.negative).toBeGreaterThan(50)
    expect(result.data!.userScore.count.total).toBeGreaterThan(1125)
    expect(result.data!.criticScore.maxScore).toBe(100)
    expect(result.data!.criticScore.sentiment).toBe('Universal acclaim')
    expect(result.data!.criticScore.score).toBeGreaterThan(80)
    expect(result.data!.criticScore.count.positive).toBeGreaterThan(15)
    expect(result.data!.criticScore.count.neutral).toBeGreaterThan(2)
    expect(result.data!.criticScore.count.negative).toBeGreaterThan(1)
    expect(result.data!.criticScore.count.total).toBeGreaterThan(18)
  })

  test('should not find any movie detail on Metacritic', async () => {
    const service = new MetacriticService()
    const movieName = 'ThisMovieDoesNotExistAndShouldNotBeFound'
    const result = await service.getDetail(movieName, RecordType.Movie)

    expect(result.success).toBe(false)
    expect(result.data).toBeNull()
    expect(result.error).toBe('No matching entry found')
  })
})
