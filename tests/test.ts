import { describe } from '@jest/globals'
import { MetacriticService, RecordType, MetacriticSearchEntry } from '../src'
import { getSimilarity } from '../src/lib/utils'
import { parseDetailJsonResult, parseSearchJsonResult } from '../src/lib/parser'

describe('MetacriticService', () => {
  let metacriticService: MetacriticService

  beforeEach(() => {
    // Reset static props
    MetacriticService.HOMEPAGE_URL = 'https://www.metacritic.com/'
    MetacriticService.REFERER_HEADER = 'https://www.metacritic.com/'
    MetacriticService.BASE_URL = 'https://backend.metacritic.com/composer/metacritic/pages/'
    MetacriticService.SEARCH_URL = MetacriticService.BASE_URL + 'search/'

    jest.resetAllMocks()

    metacriticService = new MetacriticService()
  })

  afterEach(() => {
    // Restore all mocks
    jest.restoreAllMocks()
  })

  test('getMinimalRequestHeaders should return correct headers', () => {
    const headers = MetacriticService.getMinimalRequestHeaders()

    expect(headers).toHaveProperty('User-Agent')
    expect(Object.keys(headers).length).toBe(1)
  })

  test('getRequestHeaders should return correct headers', () => {
    const headers = MetacriticService.getRequestHeaders()

    expect(headers).toHaveProperty('User-Agent')
    expect(headers).toHaveProperty('Content-Type', 'application/json')
    expect(headers).toHaveProperty('Accept', '*/*')
    expect(headers).toHaveProperty('Referer', MetacriticService.REFERER_HEADER)
    expect(Object.keys(headers).length).toBe(4)
  })

  test('search should return results', async () => {
    const mockValue = {
      components: [
        {
          meta: {
            componentName: 'search'
          },
          data: {
            items: [
              {
                id: 1,
                typeId: RecordType.Game,
                title: 'Test Game',
                slug: 'test-game',
                criticScoreSummary: {
                  score: 70
                },
                mustSee: false,
                mustWatch: false,
                mustPlay: true
              }
            ]
          }
        }
      ]
    }

    MetacriticService.sendSearchWebRequest = jest.fn().mockResolvedValue(JSON.stringify(mockValue))

    const result = await metacriticService.search('Test Game')
    expect(result).toHaveLength(1)
    expect(result).toBeInstanceOf(Array<MetacriticSearchEntry>)
    expect(result[0].id).toBe(mockValue.components[0].data.items[0].id)
    expect(result[0].recordType).toBe(mockValue.components[0].data.items[0].typeId)
    expect(result[0].title).toBe(mockValue.components[0].data.items[0].title)
    expect(result[0].slug).toBe(mockValue.components[0].data.items[0].slug)
    expect(result[0].criticScore).toBe(mockValue.components[0].data.items[0].criticScoreSummary.score)
    expect(result[0].must).toBe(mockValue.components[0].data.items[0].mustSee || mockValue.components[0].data.items[0].mustWatch || mockValue.components[0].data.items[0].mustPlay)
    expect(result[0].similarity).toBe(1)
  })

  test('getDetail should return result', async () => {
    const searchMockValue = {
      components: [
        {
          meta: {
            componentName: 'search'
          },
          data: {
            items: [
              {
                id: 1,
                typeId: RecordType.Game,
                title: 'Test Game',
                slug: 'test-game',
                criticScoreSummary: {
                  score: 70
                },
                mustSee: false,
                mustWatch: false,
                mustPlay: true
              }
            ]
          }
        }
      ]
    }

    const mockValue = {
      components: [
        {
          meta: {
            componentName: 'product'
          },
          data: {
            item: {
              id: '1',
              typeId: RecordType.Game,
              title: 'Test Game',
              slug: 'test-game',
            }
          }
        },
        {
          meta: {
            componentName: 'critic-score-summary'
          },
          data: {
            item: {
              score: 80,
              max: 100,
              sentiment: 'positive',
              positiveCount: 40,
              neutralCount: 5,
              negativeCount: 2,
              reviewCount: 47
            }
          }
        },
        {
          meta: {
            componentName: 'user-score-summary'
          },
          data: {
            item: {
              score: 75,
              max: 100,
              sentiment: 'positive',
              positiveCount: 40,
              neutralCount: 5,
              negativeCount: 2,
              reviewCount: 47
            }
          }
        }
      ]
    }

    MetacriticService.sendSearchWebRequest = jest.fn().mockResolvedValue(JSON.stringify(searchMockValue))
    MetacriticService.sendDetailWebRequest = jest.fn().mockResolvedValue(JSON.stringify(mockValue))

    const result = await metacriticService.getDetail('Test game', RecordType.Game)
    expect(result).toBeDefined()
    expect(result!.id).toBe(mockValue.components[0].data.item.id)
    expect(result!.recordType).toBe(mockValue.components[0].data.item.typeId)
    expect(result!.title).toBe(mockValue.components[0].data.item.title)
    expect(result!.slug).toBe(mockValue.components[0].data.item.slug)
    expect(result!.criticScore).toBeDefined()
    expect(result!.criticScore!.score).toBe(mockValue.components[1].data.item.score)
    expect(result!.criticScore!.maxScore).toBe(mockValue.components[1].data.item.max)
    expect(result!.criticScore!.sentiment).toBe(mockValue.components[1].data.item.sentiment)
    expect(result!.criticScore!.count.positive).toBe(mockValue.components[1].data.item.positiveCount)
    expect(result!.criticScore!.count.neutral).toBe(mockValue.components[1].data.item.neutralCount)
    expect(result!.criticScore!.count.negative).toBe(mockValue.components[1].data.item.negativeCount)
    expect(result!.criticScore!.count.total).toBe(mockValue.components[1].data.item.reviewCount)
    expect(result!.userScore).toBeDefined()
    expect(result!.userScore!.score).toBe(mockValue.components[2].data.item.score)
    expect(result!.userScore!.maxScore).toBe(mockValue.components[2].data.item.max)
    expect(result!.userScore!.sentiment).toBe(mockValue.components[2].data.item.sentiment)
    expect(result!.userScore!.count.positive).toBe(mockValue.components[2].data.item.positiveCount)
    expect(result!.userScore!.count.neutral).toBe(mockValue.components[2].data.item.neutralCount)
    expect(result!.userScore!.count.negative).toBe(mockValue.components[2].data.item.negativeCount)
    expect(result!.userScore!.count.total).toBe(mockValue.components[2].data.item.reviewCount)
  })

  test('search should handle invalid response format', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const metacriticSpy = jest.spyOn(MetacriticService, 'sendSearchWebRequest').mockImplementation(() => {
      return Promise.resolve('Invalid JSON')
    })

    const result = await metacriticService.search('Test Game')
    expect(result).toHaveLength(0)

    consoleSpy.mockRestore()
    metacriticSpy.mockRestore()
  })

  test('search should handle empty response', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const metacriticSpy = jest.spyOn(MetacriticService, 'sendSearchWebRequest').mockImplementation(() => {
      return Promise.resolve(undefined)
    })

    const result = await metacriticService.search('Test Game')
    expect(result).toHaveLength(0)

    consoleSpy.mockRestore()
    metacriticSpy.mockRestore()
  })

  test('getDetail should handle invalid response format', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const metacriticSpy = jest.spyOn(MetacriticService, 'sendDetailWebRequest').mockImplementation(() => {
      return Promise.resolve('Invalid JSON')
    })

    const result = await metacriticService.getDetail('Test Game', RecordType.Game)
    expect(result).toBeNull()

    consoleSpy.mockRestore()
    metacriticSpy.mockRestore()
  })

  test('getDetail should handle empty response', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const metacriticSpy = jest.spyOn(MetacriticService, 'sendDetailWebRequest').mockImplementation(() => {
      return Promise.resolve(undefined)
    })

    const result = await metacriticService.getDetail('Test Game', RecordType.Game)
    expect(result).toBeNull()

    consoleSpy.mockRestore()
    metacriticSpy.mockRestore()
  })

  test('search should return empty array for empty search key', async () => {
    const result = await metacriticService.search('')
    expect(result).toEqual([])
  })

  test('getDetail should return null for empty search key', async () => {
    const result = await metacriticService.getDetail('', RecordType.Game)
    expect(result).toBeNull()
  })

  test('search should return empty array for invalid search key', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const apiKeySpy = jest.spyOn(MetacriticService, 'sendApiKeyRetrievalWebsiteRequest').mockImplementation(() => {
      return Promise.resolve(null)
    })

    const result = await metacriticService.search('Test Game')
    expect(result).toEqual([])

    expect(consoleSpy.mock.calls.length).toBe(1)
    apiKeySpy.mockRestore()
    consoleSpy.mockRestore()
  })

  test('getDetail should return null for invalid search key', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const apiKeySpy = jest.spyOn(MetacriticService, 'sendApiKeyRetrievalWebsiteRequest').mockImplementation(() => {
      return Promise.resolve(null)
    })

    const result = await metacriticService.getDetail('Test Game', RecordType.Game)
    expect(result).toBeNull()

    expect(consoleSpy.mock.calls.length).toBe(1)
    apiKeySpy.mockRestore()
    consoleSpy.mockRestore()
  })

  test('sendApiKeyRetrievalWebsiteRequest should return null if key not found', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      text: jest.fn().mockResolvedValue('Not Found')
    }
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as any)
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const response = await MetacriticService.sendApiKeyRetrievalWebsiteRequest()
    expect(response).toBeNull()
    fetchSpy.mockRestore()
    consoleSpy.mockRestore()
  })

  test('sendApiKeyRetrievalWebsiteRequest should return null if an exception is thrown', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() => {
      throw new Error('Network error')
    })
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const response = await MetacriticService.sendApiKeyRetrievalWebsiteRequest()
    expect(response).toBeNull()
    fetchSpy.mockRestore()
    consoleSpy.mockRestore()
  })

  test('sendSearchWebRequest should handle exceptions', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() => {
      throw new Error('Network error')
    })
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const result = await MetacriticService.sendSearchWebRequest('test-slug', 'test-api-key', RecordType.Game)
    expect(result).toBeUndefined()
    fetchSpy.mockRestore()
    consoleSpy.mockRestore()
  })

  test('sendDetailWebRequest should handle exceptions', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() => {
      throw new Error('Network error')
    })
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const result = await MetacriticService.sendDetailWebRequest('test-slug', 'test-api-key', RecordType.Game)
    expect(result).toBeUndefined()
    fetchSpy.mockRestore()
    consoleSpy.mockRestore()
  })

  test('sendDetailWebRequest should return undefined if recordType is not supported', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() => {
      throw new Error('Network error')
    })
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    // @ts-expect-error - TypeScript error for recordType not defined in the enum
    const result = await MetacriticService.sendDetailWebRequest('test-slug', 'test-api-key', 85)
    expect(result).toBeUndefined()
    fetchSpy.mockRestore()
    consoleSpy.mockRestore()
  })
})

describe('search parser', () => {
  const data = {
    components: [
      {
        meta: {
          componentName: 'search'
        },
        data: {
          items: [
            {
              id: 1,
              typeId: RecordType.Game,
              title: 'Test Game',
              slug: 'test-game',
              criticScoreSummary: {
                score: 70
              },
              mustSee: false,
              mustWatch: false,
              mustPlay: true
            }
          ]
        }
      }
    ]
  }

  test('should parse search result correctly', () => {
    const jsonResult = JSON.stringify(data)

    const parsingResult = parseSearchJsonResult(jsonResult, 'Test Game', 0.5)
    expect(parsingResult).toHaveLength(1)
    expect(parsingResult).toBeInstanceOf(Array<MetacriticSearchEntry>)
    expect(parsingResult[0].id).toBe(data.components[0].data.items[0].id)
    expect(parsingResult[0].recordType).toBe(data.components[0].data.items[0].typeId)
    expect(parsingResult[0].title).toBe(data.components[0].data.items[0].title)
    expect(parsingResult[0].slug).toBe(data.components[0].data.items[0].slug)
    expect(parsingResult[0].criticScore).toBe(data.components[0].data.items[0].criticScoreSummary.score)
    expect(parsingResult[0].must).toBe(data.components[0].data.items[0].mustSee || data.components[0].data.items[0].mustWatch || data.components[0].data.items[0].mustPlay)
    expect(parsingResult[0].similarity).toBe(1)
  })

  test('should skip entries with low similarity', () => {
    const jsonResult = JSON.stringify(data)

    const parsingResult = parseSearchJsonResult(jsonResult, 'Nonexistent', 0.5)
    expect(parsingResult).toHaveLength(0)
  })

  test('should handle invalid JSON gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    const invalidJson = '{ invalid json }'
    const parsingResult = parseSearchJsonResult(invalidJson, 'Test Game', 0.5)
    expect(parsingResult).toHaveLength(0)

    consoleSpy.mockRestore()
  })

  test('should handle empty data array', () => {
    const emptyData = {
      components: [
        {
          meta: {
            componentName: 'search'
          },
          data: {
            items: []
          }
        }
      ]
    }
    const jsonResult = JSON.stringify(emptyData)
    const parsingResult = parseSearchJsonResult(jsonResult, 'Test Game', 0.5)
    expect(parsingResult).toHaveLength(0)
  })

  test('should order results by similarity by default', () => {
    const dataWithMultipleEntries = {
      components: [
        {
          meta: {
            componentName: 'search'
          },
          data: {
            items: [
              {
                id: 1,
                typeId: RecordType.Game,
                title: 'Test Game',
                slug: 'test-game',
                criticScoreSummary: {
                  score: 70
                },
                mustSee: false,
                mustWatch: false,
                mustPlay: true
              },
              {
                id: 2,
                typeId: RecordType.Game,
                title: 'Another Game',
                slug: 'another-game',
                criticScoreSummary: {
                  score: 80
                },
                mustSee: false,
                mustWatch: false,
                mustPlay: true
              }
            ]
          }
        }
      ]
    }

    const jsonResult = JSON.stringify(dataWithMultipleEntries)
    const parsingResult = parseSearchJsonResult(jsonResult, 'Test', 0.1)
    expect(parsingResult).toHaveLength(2)
    expect(parsingResult[0].id).toBe(1)
    expect(parsingResult[1].id).toBe(2)
  })

  test('should not order results by similarity if sortBySimilarity is false', () => {
    const dataWithMultipleEntries = {
      components: [
        {
          meta: {
            componentName: 'search'
          },
          data: {
            items: [
              {
                id: 1,
                typeId: RecordType.Game,
                title: 'Test Game',
                slug: 'test-game',
                criticScoreSummary: {
                  score: 70
                },
                mustSee: false,
                mustWatch: false,
                mustPlay: true
              },
              {
                id: 2,
                typeId: RecordType.Game,
                title: 'Another Game',
                slug: 'another-game',
                criticScoreSummary: {
                  score: 80
                },
                mustSee: false,
                mustWatch: false,
                mustPlay: true
              }
            ]
          }
        }
      ]
    }

    const jsonResult = JSON.stringify(dataWithMultipleEntries)
    const parsingResult = parseSearchJsonResult(jsonResult, 'Game', 0.1, false)
    expect(parsingResult).toHaveLength(2)
    expect(parsingResult[0].id).toBe(1)
    expect(parsingResult[1].id).toBe(2)
  })
})

describe('detail parser', () => {
  const data = {
    components: [
      {
        meta: {
          componentName: 'product'
        },
        data: {
          item: {
            id: '1',
            typeId: RecordType.Game,
            title: 'Test Game',
            slug: 'test-game',
          }
        }
      },
      {
        meta: {
          componentName: 'critic-score-summary'
        },
        data: {
          item: {
            score: 80,
            max: 100,
            sentiment: 'positive',
            positiveCount: 40,
            neutralCount: 5,
            negativeCount: 2,
            reviewCount: 47
          }
        }
      },
      {
        meta: {
          componentName: 'user-score-summary'
        },
        data: {
          item: {
            score: 75,
            max: 100,
            sentiment: 'positive',
            positiveCount: 40,
            neutralCount: 5,
            negativeCount: 2,
            reviewCount: 47
          }
        }
      }
    ]
  }

  test('should parse search result correctly', () => {
    const jsonResult = JSON.stringify(data)
    const parsingResult = parseDetailJsonResult(jsonResult, true)

    expect(parsingResult).toBeDefined()

    expect(parsingResult!.id).toBe(data.components[0].data.item.id)
    expect(parsingResult!.recordType).toBe(data.components[0].data.item.typeId)
    expect(parsingResult!.title).toBe(data.components[0].data.item.title)
    expect(parsingResult!.slug).toBe(data.components[0].data.item.slug)
    expect(parsingResult!.criticScore).toBeDefined()
    expect(parsingResult!.criticScore!.score).toBe(data.components[1].data.item.score)
    expect(parsingResult!.criticScore!.maxScore).toBe(data.components[1].data.item.max)
    expect(parsingResult!.criticScore!.sentiment).toBe(data.components[1].data.item.sentiment)
    expect(parsingResult!.criticScore!.count.positive).toBe(data.components[1].data.item.positiveCount)
    expect(parsingResult!.criticScore!.count.neutral).toBe(data.components[1].data.item.neutralCount)
    expect(parsingResult!.criticScore!.count.negative).toBe(data.components[1].data.item.negativeCount)
    expect(parsingResult!.criticScore!.count.total).toBe(data.components[1].data.item.reviewCount)
    expect(parsingResult!.userScore).toBeDefined()
    expect(parsingResult!.userScore!.score).toBe(data.components[2].data.item.score)
    expect(parsingResult!.userScore!.maxScore).toBe(data.components[2].data.item.max)
    expect(parsingResult!.userScore!.sentiment).toBe(data.components[2].data.item.sentiment)
    expect(parsingResult!.userScore!.count.positive).toBe(data.components[2].data.item.positiveCount)
    expect(parsingResult!.userScore!.count.neutral).toBe(data.components[2].data.item.neutralCount)
    expect(parsingResult!.userScore!.count.negative).toBe(data.components[2].data.item.negativeCount)
    expect(parsingResult!.userScore!.count.total).toBe(data.components[2].data.item.reviewCount)

  })

  test('should handle invalid JSON gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    const invalidJson = '{ invalid json }'
    const parsingResult = parseDetailJsonResult(invalidJson, true)
    expect(parsingResult).toBeNull()

    consoleSpy.mockRestore()
  })
})

describe('utils', () => {
  test('getSimilarity should return 1 for identical strings', () => {
    const result = getSimilarity('test', 'test')
    expect(result).toBe(1)
  })

  test('getSimilarity should return 0 for completely different strings', () => {
    const result = getSimilarity('test', 'banana')
    expect(result).toBe(0)
  })

  test('getSimilarity should return correct similarity for similar strings', () => {
    const result = getSimilarity('test', 'test123')
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThan(1)
  })

  test('getSimilarity should handle empty strings', () => {
    const result1 = getSimilarity('', '')
    const result2 = getSimilarity('test', '')
    expect(result1).toBe(1) // Two empty strings are identical
    expect(result2).toBe(0) // No similarity between text and empty string
  })

  test('getSimilarity should be case insensitive', () => {
    const result = getSimilarity('Test', 'test')
    expect(result).toBe(1) // Or whatever behavior is expected for case sensitivity
  })

  test('getSimilarity should compute Elden Ring and Elden Rin correctly', () => {
    const result = getSimilarity('Elden Ring', 'Elden Rin')
    expect(result).toBe(0.9)
  })
})
