import { parseDetailJsonResult, parseSearchJsonResult } from './parser'
import UserAgent from 'user-agents'
import { MetacriticEntry, RecordType, MetacriticSearchEntry } from './types'

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

  constructor(minSimilarity: number = 0.5) {
    this.minSimilarity = minSimilarity
  }

  async search(searchKey: string, recordType?: RecordType, sortBySimilarity: boolean = true): Promise<MetacriticSearchEntry[]> {
    if (!searchKey) {
      return []
    }

    if (!this.apiKey) {
      const searchInfo = await MetacriticService.sendApiKeyRetrievalWebsiteRequest()
      if (searchInfo) {
        this.apiKey = searchInfo.apiKey
      } else {
        console.error('Failed to retrieve API key')
        return []
      }
    }

    const jsonResult = await MetacriticService.sendSearchWebRequest(searchKey, this.apiKey, recordType)
    if (jsonResult) {
      return parseSearchJsonResult(jsonResult, searchKey, this.minSimilarity, sortBySimilarity)
    }

    return []
  }

  async getDetail(searchKey: string, recordType: RecordType, sortBySimilarity: boolean = true): Promise<MetacriticEntry | null> {
    if (!searchKey) {
      return null
    }

    if (!this.apiKey) {
      const searchInfo = await MetacriticService.sendApiKeyRetrievalWebsiteRequest()
      if (searchInfo) {
        this.apiKey = searchInfo.apiKey
      } else {
        console.error('Failed to retrieve API key')
        return null
      }
    }

    const searchResult = await this.search(searchKey, recordType, sortBySimilarity)
    if (searchResult && searchResult.length > 0) {
      const detailResult = await MetacriticService.sendDetailWebRequest(searchResult[0].slug, this.apiKey, recordType)

      if (detailResult) {
        return parseDetailJsonResult(detailResult, searchResult[0].must)
      }
    }

    return null
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
    const userAgent = new UserAgent()
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
