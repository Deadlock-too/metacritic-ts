import { parseDetailJsonResult, parseSearchJsonResult } from './parser'
import { DetailResult, RecordType, SearchResult } from './types'

class SearchInformations {
  apiKey: string

  constructor(scriptContent: string) {
    this.apiKey = this.extractApiFromScript(scriptContent)
  }

  extractApiFromScript(scriptContent: any) {
    const apiKeyPattern = /apiKey=([^"&]+)/
    let matches = scriptContent.match(apiKeyPattern)
    if (matches) {
      return matches[1]
    }
  }
}

export class MetacriticService {
  private minSimilarity: number
  private apiKey?: string

  static REFERER_HEADER = 'https://www.metacritic.com/'
  static HOMEPAGE_URL = 'https://www.metacritic.com/'
  static BASE_URL = 'https://backend.metacritic.com/composer/metacritic/pages/'
  static SEARCH_URL = MetacriticService.BASE_URL + 'search/'

  static USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  ]

  constructor(minSimilarity: number = 0.5) {
    this.minSimilarity = minSimilarity
  }

  async search(searchKey: string, recordType?: RecordType, sortBySimilarity: boolean = true): Promise<SearchResult> {
    if (!searchKey) {
      return {
        success: false,
        data: [],
        error: 'Search key is required'
      }
    }

    if (!this.apiKey) {
      const searchInfo = await MetacriticService.sendApiKeyRetrievalWebsiteRequest()
      if (searchInfo) {
        this.apiKey = searchInfo.apiKey
      } else {
        console.error('Failed to retrieve API key')
        return {
          success: false,
          data: [],
          error: 'Failed to retrieve API key'
        }
      }
    }

    const jsonResult = await MetacriticService.sendSearchWebRequest(searchKey, this.apiKey, recordType)
    if (!jsonResult) {
      return {
        success: false,
        data: [],
        error: 'Failed to fetch search results'
      }
    }

    try {
      JSON.parse(jsonResult)
    } catch {
      return {
        success: false,
        data: [],
        error: 'Invalid search response format'
      }
    }

    return {
      success: true,
      data: parseSearchJsonResult(jsonResult, searchKey, this.minSimilarity, sortBySimilarity)
    }
  }

  async getDetail(searchKey: string, recordType: RecordType, sortBySimilarity: boolean = true): Promise<DetailResult> {
    if (!searchKey) {
      return {
        success: false,
        data: null,
        error: 'Search key is required'
      }
    }

    if (!this.apiKey) {
      const searchInfo = await MetacriticService.sendApiKeyRetrievalWebsiteRequest()
      if (searchInfo) {
        this.apiKey = searchInfo.apiKey
      } else {
        console.error('Failed to retrieve API key')
        return {
          success: false,
          data: null,
          error: 'Failed to retrieve API key'
        }
      }
    }

    const searchResult = await this.search(searchKey, recordType, sortBySimilarity)
    if (!searchResult.success) {
      return {
        success: false,
        data: null,
        error: searchResult.error || 'Failed to search detail entry'
      }
    }

    if (searchResult.data.length === 0) {
      return {
        success: false,
        data: null,
        error: 'No matching entry found'
      }
    }

    const detailResult = await MetacriticService.sendDetailWebRequest(searchResult.data[0].slug, this.apiKey, recordType)

    if (!detailResult) {
      return {
        success: false,
        data: null,
        error: 'Failed to fetch detail result'
      }
    }

    try {
      JSON.parse(detailResult)
    } catch {
      return {
        success: false,
        data: null,
        error: 'Invalid detail response format'
      }
    }

    const parsedDetail = parseDetailJsonResult(detailResult, searchResult.data[0].must)
    if (!parsedDetail) {
      return {
        success: false,
        data: null,
        error: 'Invalid detail response format'
      }
    }

    return {
      success: true,
      data: parsedDetail
    }
  }

  static async sendSearchWebRequest(searchKey: string, apiKey: string, recordType?: RecordType) {
    const headers = this.getRequestHeaders()

    const searchUrl = new URL(MetacriticService.SEARCH_URL + encodeURI(searchKey) + '/web')

    searchUrl.searchParams.append('apiKey', apiKey)

    if (recordType) {
      searchUrl.searchParams.append('mcoTypeId', recordType.toString())
    }

    try {
      const response = await fetch(searchUrl, {
        headers: headers,
        method: 'GET',
        signal: AbortSignal.timeout(60000)
      })

      if (response.ok) {
        return await response.text()
      }
    } catch (error) {
      console.error('Error fetching search results:', error)
    }
  }

  static async sendDetailWebRequest(slug: string, apiKey: string, recordType: RecordType) {
    const headers = this.getRequestHeaders()

    let baseUrl = MetacriticService.BASE_URL
    switch (recordType) {
      case RecordType.Game:
        baseUrl = baseUrl + 'games/'
        break
      case RecordType.Movie:
        baseUrl = baseUrl + 'movies/'
        break
      case RecordType.TVShow:
        baseUrl = baseUrl + 'shows/'
        break
      default:
        console.error('Unsupported record type for detail request:', recordType)
        return
    }

    const detailUrl = new URL(baseUrl + encodeURI(slug) + '/web')

    detailUrl.searchParams.append('apiKey', apiKey)

    try {
      const response = await fetch(detailUrl, {
        headers: headers,
        method: 'GET',
        signal: AbortSignal.timeout(60000)
      })

      if (response.ok) {
        return await response.text()
      }
    } catch (error) {
      console.error('Error fetching detail result:', error)
    }
  }

  static getRequestHeaders() {
    const minimumHeaders = this.getMinimalRequestHeaders()
    return {
      ...minimumHeaders,
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Referer': MetacriticService.REFERER_HEADER,
    }
  }

  static getMinimalRequestHeaders() {
    const userAgent = MetacriticService.USER_AGENTS[Math.floor(Math.random() * MetacriticService.USER_AGENTS.length)]
    return {
      'User-Agent': userAgent.toString(),
    }
  }

  static async sendApiKeyRetrievalWebsiteRequest(): Promise<SearchInformations | null> {
    const headers = this.getMinimalRequestHeaders()
    try {
      const response = await fetch(MetacriticService.HOMEPAGE_URL, {
        headers: headers,
        signal: AbortSignal.timeout(60000)
      })

      if (response.ok) {
        const html = await response.text()

        const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/g
        const scripts: string[] = []
        let match
        while ((match = scriptPattern.exec(html)) !== null) {
          scripts.push(match[1])
        }

        for (const script of scripts) {
          const searchInfo = new SearchInformations(script)
          if (searchInfo.apiKey) {
            return searchInfo
          }
        }
      }

      return null
    } catch (error) {
      console.error('Error fetching website:', error)
      return null
    }
  }
}
