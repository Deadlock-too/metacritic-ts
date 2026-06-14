import { Result } from '../core/result'

export enum RecordType {
  TVShow = 1,
  Movie = 2,
  Game = 13,
}

export type MetacriticSearchEntry = {
  id: number
  recordType: RecordType
  title: string
  slug: string
  must: boolean
  /** The critic score as a bare number (the search API only exposes this). */
  criticScoreValue: number
  similarity: number
}

/** Result of {@link MetacriticService.search}. */
export type SearchResult = Result<MetacriticSearchEntry[]>

export type MetacriticEntry = {
  id: number
  recordType: RecordType
  title: string
  slug: string
  must: boolean
  userScore: Score
  criticScore: Score
}

/** Result of {@link MetacriticService.getDetail}. */
export type DetailResult = Result<MetacriticEntry | null>

export type Score = {
  score: number
  maxScore: number
  sentiment: string
  count: {
    positive: number
    neutral: number
    negative: number
    total: number
  }
}

// ---------------------------------------------------------------------------
// Shapes of the raw Metacritic backend responses, used by the parser.
// ---------------------------------------------------------------------------

export type MetacriticComponent<T> = {
  meta: { componentName: string }
  data: T
}

export type MetacriticResponse<T> = {
  components: MetacriticComponent<T>[]
}

export type RawSearchItem = {
  id: number
  typeId: number
  title: string
  slug: string
  criticScoreSummary?: { score: number }
  mustSee?: boolean
  mustWatch?: boolean
  mustPlay?: boolean
}

export type RawProductItem = {
  id: number
  typeId: number
  title: string
  slug: string
}

export type RawScoreItem = {
  score: number
  max: number
  sentiment: string
  positiveCount: number
  neutralCount: number
  negativeCount: number
  reviewCount: number
}
