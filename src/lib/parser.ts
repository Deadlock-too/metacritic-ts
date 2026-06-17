import { getMatchScore, ScraperError } from '../core'
import {
  MetacriticComponent,
  MetacriticEntry,
  MetacriticResponse,
  MetacriticSearchEntry,
  RawProductItem,
  RawScoreItem,
  RawSearchItem,
  RecordType,
  Score,
} from './types'

export function parseSearchJsonResult(
  jsonString: string,
  searchKey: string,
  minSimilarity: number,
  sortBySimilarity: boolean = true,
): MetacriticSearchEntry[] {
  const parsed = parse<MetacriticResponse<{ items: RawSearchItem[] }>>(jsonString)
  const items = findComponent(parsed, 'search').data.items
  if (!Array.isArray(items)) {
    throw new ScraperError(
      'Unexpected Metacritic search response: missing "items" (the site structure may have changed)',
    )
  }

  const entries: MetacriticSearchEntry[] = []
  for (const item of items) {
    const entry = mapSearchEntry(item, searchKey)
    if (entry.similarity < minSimilarity) {
      continue
    }
    entries.push(entry)
  }

  return sortBySimilarity ? entries.sort((a, b) => b.similarity - a.similarity) : entries
}

export function parseDetailJsonResult(jsonString: string, must: boolean): MetacriticEntry {
  const parsed = parse<MetacriticResponse<{ item: RawProductItem | RawScoreItem }>>(jsonString)
  return mapDetailEntry(parsed, must)
}

function mapSearchEntry(data: RawSearchItem, searchKey: string): MetacriticSearchEntry {
  return {
    id: data.id,
    recordType: data.typeId as RecordType,
    title: data.title,
    slug: data.slug,
    criticScoreValue: data.criticScoreSummary?.score ?? 0,
    must: Boolean(data.mustSee || data.mustWatch || data.mustPlay),
    similarity: getMatchScore(data.title, searchKey),
  }
}

function mapDetailEntry(
  data: MetacriticResponse<{ item: RawProductItem | RawScoreItem }>,
  must: boolean,
): MetacriticEntry {
  const product = findComponent(data, 'product').data.item as RawProductItem
  const criticScore = findComponent(data, 'critic-score-summary').data.item as RawScoreItem
  const userScore = findComponent(data, 'user-score-summary').data.item as RawScoreItem

  return {
    id: product.id,
    recordType: product.typeId as RecordType,
    title: product.title,
    slug: product.slug,
    must,
    userScore: mapScore(userScore),
    criticScore: mapScore(criticScore),
  }
}

function mapScore(item: RawScoreItem): Score {
  return {
    score: item.score,
    maxScore: item.max,
    sentiment: item.sentiment,
    count: {
      positive: item.positiveCount,
      neutral: item.neutralCount,
      negative: item.negativeCount,
      total: item.reviewCount,
    },
  }
}

function parse<T>(jsonString: string): T {
  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    throw new ScraperError('Failed to parse the Metacritic response as JSON', error)
  }
}

function findComponent<T>(response: MetacriticResponse<T>, name: string): MetacriticComponent<T> {
  const component = response?.components?.find((c) => c?.meta?.componentName === name)
  if (!component) {
    throw new ScraperError(
      `Could not locate the "${name}" component in the Metacritic response (the site structure may have changed)`,
    )
  }
  return component
}
