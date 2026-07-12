# metacritic-ts

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Deadlock-too/metacritic-ts)
[![GitHub](https://img.shields.io/github/license/Deadlock-too/metacritic-ts)](https://github.com/Deadlock-too/metacritic-ts)
[![npm](https://img.shields.io/npm/v/metacritic-ts)](https://www.npmjs.com/package/metacritic-ts)
[![npm](https://img.shields.io/npm/dt/metacritic-ts)](https://www.npmjs.com/package/metacritic-ts)
[![CI](https://github.com/Deadlock-too/metacritic-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/Deadlock-too/metacritic-ts/actions/workflows/ci.yml)

A TypeScript library for interacting with the Metacritic website API. Easily search for games, movies and tv shows and retrieve their Metacritic ratings.

This library takes inspiration from another library of mine [howlongtobeat-ts](https://github.com/Deadlock-too/howlongtobeat-ts).

> ⚠️ **Disclaimer:** This library is not an official API and is not affiliated nor endorsed with Metacritic.com or Fandom Inc
> in any way. Please use this library responsibly and do not abuse or overload the Metacritic servers. Use at your own risk.

## Features

- Search for games, movies and tv shows on Metacritic
- Retrieve rating data (critic and user scores) for games, movies and tv shows
- Resilient networking: configurable timeouts, retries with backoff, `429` handling, an injectable `fetch` and `AbortSignal` support
- Automatic API-key caching, shared across concurrent calls and refreshed on auth failure
- Fully typed, with a discriminated-union result type and zero `console` noise

## Installation

```bash
npm install metacritic-ts
```

Requires Node.js 18 or newer (the library uses the global `fetch`). Ships both ESM and CommonJS builds.

## Usage

```typescript
import { MetacriticService, RecordType } from 'metacritic-ts'

const metacritic = new MetacriticService()

// Search across all record types (games, movies, tv shows).
const results = await metacritic.search('The Last of Us')
if (results.success) {
  console.log(results.data) // MetacriticSearchEntry[]
} else {
  console.error(results.error)
}

// Restrict to a record type via the options object.
await metacritic.search('Breaking Bad', { recordType: RecordType.TVShow })

// Fetch the full critic/user score breakdown for the best match.
const detail = await metacritic.getDetail('The Last of Us Part II', RecordType.Game)
if (detail.success && detail.data) {
  console.log(detail.data.criticScore.score, detail.data.userScore.score)
}
```

### Configuration

Pass an options object to the constructor (a bare `number` is still accepted as `minSimilarity` for backwards compatibility):

```typescript
import { MetacriticService, consoleLogger } from 'metacritic-ts'

const metacritic = new MetacriticService({
  minSimilarity: 0.5, // min similarity threshold (0–1), clamped
  timeout: 30_000, // per-request timeout in ms
  retries: 2, // retry attempts on transient failures / 429 / 5xx
  logger: consoleLogger, // opt in to diagnostic logging (default: silent)
  // fetch: myCustomFetch,  // inject a custom fetch (proxy, undici agent, …)
})

// Cancel in-flight requests.
const controller = new AbortController()
const promise = metacritic.search('Halo', { signal: controller.signal })
controller.abort()
```

## API

### `MetacriticService`

- `constructor(options?: number | ScraperOptions)` — `ScraperOptions` extends the HTTP options (`timeout`, `retries`, `retryDelay`, `fetch`, `userAgents`, `logger`) with `minSimilarity`.
- `search(searchKey, options?): Promise<SearchResult>` — `options` is `{ recordType?, sortBySimilarity?, signal? }`.
- `getDetail(searchKey, recordType, options?): Promise<DetailResult>` — `options` is `{ sortBySimilarity?, signal? }`.

> For `getDetail`, `sortBySimilarity` (default `true`) is important: with `false`, the first API result may not be the one you are looking for.

### `SearchResult` / `DetailResult`

Discriminated unions:

```typescript
type SearchResult = { success: true; data: MetacriticSearchEntry[] } | { success: false; error: string }
type DetailResult = { success: true; data: MetacriticEntry | null } | { success: false; error: string }
```

### `RecordType`

`TVShow`, `Movie`, `Game`.

### `MetacriticSearchEntry`

`id`, `recordType`, `title`, `slug`, `must`, `criticScoreValue` (the critic score as a number), `similarity`.

### `MetacriticEntry`

`id`, `recordType`, `title`, `slug`, `must`, and `criticScore` / `userScore`, each a `Score`:

```typescript
type Score = {
  score: number
  maxScore: number
  sentiment: string
  count: { positive: number; neutral: number; negative: number; total: number }
}
```

## Development

```bash
git clone https://github.com/Deadlock-too/metacritic-ts.git
cd metacritic-ts
npm install

npm run build            # build with tsup
npm test                 # unit tests
npm run test:integration # live API tests (hit Metacritic)
npm run test:coverage    # unit tests with coverage
npm run lint             # eslint
npm run format           # prettier
```

Releases are managed with [Changesets](https://github.com/changesets/changesets): run `npm run changeset` to record a change; the release workflow publishes to npm once the generated version PR is merged.

## Issues, Questions & Discussions

If you found a bug, report it as soon as possible creating an [issue](https://github.com/Deadlock-too/metacritic-ts/issues/new), the code is not perfect for sure, and I will be happy to fix it.
If you need any new feature, or want to discuss the current implementation/features, consider opening a [discussion](https://github.com/Deadlock-too/metacritic-ts/discussions/) or even propose a change with a [Pull Request](https://github.com/Deadlock-too/metacritic-ts/pulls).

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/Deadlock-too/metacritic-ts/blob/main/LICENSE) file for details.
