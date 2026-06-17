import { parseDetailJsonResult, parseSearchJsonResult } from './parser'
import { DetailResult, RecordType, SearchEntryResult, SearchResult } from './types'
import { BaseScraperService, ScraperOptions, ScraperError, fail, ok } from '../core'

export interface MetacriticSearchOptions {
  /** Restrict results to a single record type (game / movie / TV show). */
  recordType?: RecordType
  /** Sort results by similarity to the search key (default: true). */
  sortBySimilarity?: boolean
  /** Caller-supplied signal to cancel the in-flight request(s). */
  signal?: AbortSignal
}

export interface MetacriticDetailOptions {
  /**
   * Sort the underlying search by similarity before picking the top result.
   * Important for `getDetail`: with `false`, the first API result may not be the
   * one you are looking for. Default: true.
   */
  sortBySimilarity?: boolean
  signal?: AbortSignal
}

const API_KEY_PATTERN = /apiKey=([^"&]+)/

export class MetacriticService extends BaseScraperService {
  private apiKey?: string
  private apiKeyPromise?: Promise<string | null>

  static REFERER_HEADER = 'https://www.metacritic.com/'
  static HOMEPAGE_URL = 'https://www.metacritic.com/'
  static BASE_URL = 'https://backend.metacritic.com/composer/metacritic/pages/'
  static SEARCH_URL = MetacriticService.BASE_URL + 'search/'

  constructor(options: number | ScraperOptions = {}) {
    super(options)
  }

  async search(searchKey: string, options: MetacriticSearchOptions = {}): Promise<SearchResult> {
    if (!searchKey) {
      return fail('Search key is required')
    }

    try {
      const response = await this.requestWithApiKey(
        (apiKey) =>
          this.http.request(
            this.buildSearchUrl(searchKey, apiKey, options.recordType),
            { headers: REQUEST_HEADERS },
            options.signal,
          ),
        options.signal,
      )
      if (response === null) return fail('Failed to retrieve API key')
      if (!response.ok) return fail(`Search request failed with status ${response.status}`)

      const body = await response.text()
      return ok(parseSearchJsonResult(body, searchKey, this.minSimilarity, options.sortBySimilarity ?? true))
    } catch (error) {
      this.logger.error('Error during search:', error)
      return fail(error instanceof ScraperError ? error.message : 'Failed to fetch search results')
    }
  }

  /** Convenience wrapper returning only the single best search match (or `null`). */
  async searchOne(searchKey: string, options: MetacriticSearchOptions = {}): Promise<SearchEntryResult> {
    const result = await this.search(searchKey, options)
    if (!result.success) return result
    return ok(result.data.length > 0 ? result.data[0] : null)
  }

  async getDetail(
    searchKey: string,
    recordType: RecordType,
    options: MetacriticDetailOptions = {},
  ): Promise<DetailResult> {
    if (!searchKey) {
      return fail('Search key is required')
    }

    const searchResult = await this.search(searchKey, {
      recordType,
      sortBySimilarity: options.sortBySimilarity ?? true,
      signal: options.signal,
    })
    if (!searchResult.success) {
      return fail(searchResult.error)
    }
    if (searchResult.data.length === 0) {
      return fail('No matching entry found')
    }

    const top = searchResult.data[0]
    try {
      const response = await this.requestWithApiKey(
        (apiKey) =>
          this.http.request(
            this.buildDetailUrl(top.slug, apiKey, recordType),
            { headers: REQUEST_HEADERS },
            options.signal,
          ),
        options.signal,
      )
      if (response === null) return fail('Failed to retrieve API key')
      if (!response.ok) return fail(`Detail request failed with status ${response.status}`)

      const body = await response.text()
      return ok(parseDetailJsonResult(body, top.must))
    } catch (error) {
      this.logger.error('Error during getDetail:', error)
      return fail(error instanceof ScraperError ? error.message : 'Failed to fetch detail result')
    }
  }

  /**
   * Runs a request that needs the (cached) Metacritic API key. If the request
   * is rejected with an auth error, the key is refreshed once and the request
   * retried — this transparently recovers from key rotation/expiry.
   */
  private async requestWithApiKey(
    run: (apiKey: string) => Promise<Response>,
    signal?: AbortSignal,
  ): Promise<Response | null> {
    let apiKey = await this.getApiKey(signal)
    if (!apiKey) return null

    let response = await run(apiKey)
    if (response.status === 401 || response.status === 403) {
      apiKey = await this.getApiKey(signal, true)
      if (!apiKey) return null
      response = await run(apiKey)
    }
    return response
  }

  /**
   * Returns the cached API key, fetching it if necessary. Concurrent callers
   * share a single in-flight request rather than each hitting the homepage.
   */
  private async getApiKey(signal?: AbortSignal, forceRefresh = false): Promise<string | null> {
    if (forceRefresh) this.apiKey = undefined
    if (this.apiKey) return this.apiKey

    if (!this.apiKeyPromise) {
      this.apiKeyPromise = this.fetchApiKey(signal)
        .then((key) => {
          this.apiKey = key ?? undefined
          return key
        })
        .finally(() => {
          this.apiKeyPromise = undefined
        })
    }
    return this.apiKeyPromise
  }

  private async fetchApiKey(signal?: AbortSignal): Promise<string | null> {
    try {
      const response = await this.http.request(MetacriticService.HOMEPAGE_URL, {}, signal)
      if (!response.ok) return null

      const html = await response.text()
      const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/g
      let match: RegExpExecArray | null
      while ((match = scriptPattern.exec(html)) !== null) {
        const keyMatch = match[1].match(API_KEY_PATTERN)
        if (keyMatch) return keyMatch[1]
      }
      return null
    } catch (error) {
      this.logger.error('Error fetching API key:', error)
      return null
    }
  }

  private buildSearchUrl(searchKey: string, apiKey: string, recordType?: RecordType): URL {
    const url = new URL(MetacriticService.SEARCH_URL + encodeURI(searchKey) + '/web')
    url.searchParams.append('apiKey', apiKey)
    if (recordType) {
      url.searchParams.append('mcoTypeId', recordType.toString())
    }
    return url
  }

  private buildDetailUrl(slug: string, apiKey: string, recordType: RecordType): URL {
    const path = DETAIL_PATHS[recordType]
    if (!path) {
      throw new ScraperError(`Unsupported record type for detail request: ${recordType}`)
    }
    const url = new URL(MetacriticService.BASE_URL + path + encodeURI(slug) + '/web')
    url.searchParams.append('apiKey', apiKey)
    return url
  }
}

const REQUEST_HEADERS = {
  'Content-Type': 'application/json',
  Accept: '*/*',
  Referer: MetacriticService.REFERER_HEADER,
}

const DETAIL_PATHS: Partial<Record<RecordType, string>> = {
  [RecordType.Game]: 'games/',
  [RecordType.Movie]: 'movies/',
  [RecordType.TVShow]: 'shows/',
}
