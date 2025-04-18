import { getSimilarity } from './utils'
import { MetacriticEntry, RecordType, MetacriticSearchEntry } from './types'

export function parseSearchJsonResult(jsonString: string, searchKey: string, minSimilarity: number, sortBySimilarity: boolean = true): MetacriticSearchEntry[] {
  try {
    const parsedData = JSON.parse(jsonString)
    const entries: MetacriticSearchEntry[] = []

    const itemsList = parsedData.components.find((component: any) => component.meta.componentName === 'search').data.items
    for (const item of itemsList) {
      const entry = mapSearchEntry(item, searchKey)

      if (entry.similarity < minSimilarity) {
        continue
      }
      entries.push(entry)
    }

    return sortBySimilarity ? entries.sort((a, b) => b.similarity - a.similarity) : entries
  } catch (error) {
    console.error('Error parsing JSON:', error)
    return []
  }
}

export function parseDetailJsonResult(jsonString: string, must: boolean): MetacriticEntry | null {
  try {
    const parsedData = JSON.parse(jsonString)
    return mapDetailEntry(parsedData, must)
  } catch (error) {
    console.error('Error parsing JSON:', error)
    return null
  }
}

function mapSearchEntry(data: any, searchKey: string): MetacriticSearchEntry {
  return {
    id: data.id,
    recordType: data.typeId as RecordType,
    title: data.title,
    slug: data.slug,
    criticScore: data.criticScoreSummary.score,
    must: data.mustSee || data.mustWatch || data.mustPlay,
    similarity: getSimilarity(data.title, searchKey)
  }
}

function mapDetailEntry(data: any, must: boolean): MetacriticEntry {
  const product = data.components.find((component: any) => component.meta.componentName === 'product').data.item
  const criticScoreSummary = data.components.find((component: any) => component.meta.componentName === 'critic-score-summary').data.item
  const userScoreSummary = data.components.find((component: any) => component.meta.componentName === 'user-score-summary').data.item

  return {
    id: product.id,
    recordType: product.typeId as RecordType,
    title: product.title,
    slug: product.slug,
    must: must,
    userScore: {
      score: userScoreSummary.score,
      maxScore: userScoreSummary.max,
      sentiment: userScoreSummary.sentiment,
      count: {
        positive: userScoreSummary.positiveCount,
        neutral: userScoreSummary.neutralCount,
        negative: userScoreSummary.negativeCount,
        total: userScoreSummary.reviewCount,
      }
    },
    criticScore: {
      score: criticScoreSummary.score,
      maxScore: criticScoreSummary.max,
      sentiment: criticScoreSummary.sentiment,
      count: {
        positive: criticScoreSummary.positiveCount,
        neutral: criticScoreSummary.neutralCount,
        negative: criticScoreSummary.negativeCount,
        total: criticScoreSummary.reviewCount,
      }
    },
  }
}
