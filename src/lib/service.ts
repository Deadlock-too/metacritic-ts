import { parseDetailJsonResult, parseSearchJsonResult } from './parser'
import { DetailResult, RecordType, SearchEntryResult, SearchResult } from './types'
import {
  BaseScraperService,
  HttpError,
  ScraperOptions,
  ScraperError,
  fail,
  failFrom,
  ok,
} from '@deadlock-too/scrape-kit'

/** Names the remote source in generated failure messages. */
const SUBJECT = 'Metacritic'

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

export class MetacriticService extends BaseScraperService {
  static REFERER_HEADER = 'https://www.metacritic.com/'
  /**
   * @deprecated No longer used. The Metacritic backend does not require an API
   * key, so the homepage is never fetched. Kept for backwards compatibility and
   * scheduled for removal in the next major release.
   */
  static HOMEPAGE_URL = 'https://www.metacritic.com/'
  static BASE_URL = 'https://backend.metacritic.com/composer/metacritic/pages/'
  static SEARCH_URL = MetacriticService.BASE_URL + 'search/'

  constructor(options: number | ScraperOptions = {}) {
    super(options)
  }

  async search(searchKey: string, options: MetacriticSearchOptions = {}): Promise<SearchResult> {
    if (!searchKey) {
      return fail('Search key is required', { kind: 'input' })
    }

    // Fetching and parsing are caught separately: collapsing them into one
    // `try` is what let a shape change report itself as a fetch failure.
    let body: string
    try {
      const response = await this.http.request(
        this.buildSearchUrl(searchKey, options.recordType),
        { headers: REQUEST_HEADERS },
        options.signal,
      )
      if (!response.ok) {
        throw new HttpError(`Search request failed with status ${response.status}`, response.status)
      }
      body = await response.text()
    } catch (error) {
      this.logger.error('Metacritic search request failed:', error)
      return failFrom(error, SUBJECT)
    }

    try {
      return ok(parseSearchJsonResult(body, searchKey, this.minSimilarity, options.sortBySimilarity ?? true))
    } catch (error) {
      this.logger.error('Failed to parse the Metacritic search response:', error)
      return failFrom(error, SUBJECT, 'parse')
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
      return fail('Search key is required', { kind: 'input' })
    }

    const searchResult = await this.search(searchKey, {
      recordType,
      sortBySimilarity: options.sortBySimilarity ?? true,
      signal: options.signal,
    })
    // Returned whole rather than rebuilt from `error`, which would drop the
    // classification the search had already worked out.
    if (!searchResult.success) {
      return searchResult
    }
    if (searchResult.data.length === 0) {
      return fail('No matching entry found', { kind: 'notFound' })
    }

    const top = searchResult.data[0]
    let body: string
    try {
      const response = await this.http.request(
        this.buildDetailUrl(top.slug, recordType),
        { headers: REQUEST_HEADERS },
        options.signal,
      )
      if (!response.ok) {
        throw new HttpError(`Detail request failed with status ${response.status}`, response.status)
      }
      body = await response.text()
    } catch (error) {
      this.logger.error('Metacritic detail request failed:', error)
      return failFrom(error, SUBJECT)
    }

    try {
      return ok(parseDetailJsonResult(body, top.must))
    } catch (error) {
      this.logger.error('Failed to parse the Metacritic detail response:', error)
      return failFrom(error, SUBJECT, 'parse')
    }
  }

  private buildSearchUrl(searchKey: string, recordType?: RecordType): URL {
    const url = new URL(MetacriticService.SEARCH_URL + encodeURI(searchKey) + '/web')
    if (recordType) {
      url.searchParams.append('mcoTypeId', recordType.toString())
    }
    return url
  }

  private buildDetailUrl(slug: string, recordType: RecordType): URL {
    const path = DETAIL_PATHS[recordType]
    if (!path) {
      // The caller passed a record type with no detail endpoint — an argument
      // problem, not a sign that Metacritic changed shape.
      throw new ScraperError(`Unsupported record type for detail request: ${recordType}`, undefined, 'input')
    }
    return new URL(MetacriticService.BASE_URL + path + encodeURI(slug) + '/web')
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
