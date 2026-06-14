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
  criticScore: number
  similarity: number
}

export type SearchResult = {
  success: boolean
  data: MetacriticSearchEntry[]
  error?: string
}

export type MetacriticEntry = {
  id: number
  recordType: RecordType
  title: string
  slug: string
  must: boolean
  userScore: Score
  criticScore: Score
}

export type DetailResult = {
  success: boolean
  data: MetacriticEntry | null
  error?: string
}

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
