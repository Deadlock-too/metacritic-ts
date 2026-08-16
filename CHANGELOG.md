# Changelog

## 1.3.0

### Minor Changes

- [#8](https://github.com/Deadlock-too/metacritic-ts/pull/8) [`d30fcfa`](https://github.com/Deadlock-too/metacritic-ts/commit/d30fcfa9f5d579aaa12123c807d7650ad8f02bba) Thanks [@Deadlock-too](https://github.com/Deadlock-too)! - Report what kind of failure occurred, and stop naming the wrong subsystem

  Failures now carry a machine-readable `kind` (and, for HTTP failures, the `status`) so a consumer can tell a Metacritic outage from a change that broke this library — without matching on message wording that is free to change in a patch release.

  ```ts
  const result = await metacritic.getDetail('The Last of Us Part II', RecordType.Game)
  if (!result.success) {
    result.kind // 'input' | 'transport' | 'timeout' | 'aborted' | 'http' | 'parse' | 'notFound' | 'unknown'
    result.status // set when kind is 'http'
    result.error // unchanged: prose, always present
  }
  ```

  Four defects made this necessary, and each is fixed:

  - **A parse failure reported itself as a fetch failure.** `search` wrapped the request and the parse in one `try` whose catch fell back to "Failed to fetch search results". The parser raises a `ScraperError` for the shape changes it checks explicitly, but a payload that moves in a way it does not check throws a bare `TypeError` from walking it — and that landed in the catch-all and was reported as a networking problem. `getDetail` had the same shape with "Failed to fetch detail result". Fetching and parsing are now caught separately, and the parse block claims an unattributable error as its own: with the bytes already in hand, nothing network-shaped can be failing there.
  - **`getDetail` discarded the classification of the search it wrapped.** It rebuilt the failure with `fail(searchResult.error)`, which dropped everything except the message. It now returns the failure whole.
  - **"No matching entry found" was indistinguishable from a malfunction.** It now reports `kind: 'notFound'` — an outcome, not a fault, and the branch a UI most often needs.
  - **An unsupported record type was reported as a site change.** `buildDetailUrl` threw a plain `ScraperError`, which classifies as `parse` and points the reader at Metacritic. It is a caller-argument problem and now reports `kind: 'input'`.

  Failure messages that were already accurate are unchanged (`Search key is required`, `No matching entry found`, `Search request failed with status …`, `Detail request failed with status …`, `Unsupported record type for detail request: …`, and every message from the parser). The two that changed are exactly those that were describing the wrong thing:

  | Was                              | Now                                                                                                             |
  | -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
  | `Failed to fetch search results` | `Could not reach Metacritic (network error)`, `The Metacritic request timed out`, or a parse message, per cause |
  | `Failed to fetch detail result`  | the same, classified by cause                                                                                   |

  Also re-exports `FailureKind` and `HttpError` from the toolkit. `HttpError` extends `ScraperError`, so any existing `instanceof ScraperError` check keeps matching.

  Minor rather than patch: `kind` and `status` are new public API on a returned type, and requires `@deadlock-too/scrape-kit@^1.1.0` (a minor of its own). Existing consumers keep compiling — nothing was removed or renamed, and `error` keeps its meaning, its type and its position. Consumers who were regex-matching the two messages in the table above will need to move to `kind`, which is the point of the change.

  Also drops two stale claims from the docs: the README advertised "Automatic API-key caching" and the integration suite explained its shared service instance in terms of caching that key. Neither has been true since the library stopped scraping the homepage for an API key.

## 1.2.1

### Patch Changes

- [#6](https://github.com/Deadlock-too/metacritic-ts/pull/6) [`ef184d0`](https://github.com/Deadlock-too/metacritic-ts/commit/ef184d0d12012ef5e569668cfe66aee165e1653e) Thanks [@Deadlock-too](https://github.com/Deadlock-too)! - Stop scraping the Metacritic homepage for an API key.

  Metacritic migrated to a new frontend build that no longer embeds the backend
  API key in the page, so `fetchApiKey` found nothing and every request failed
  with `Failed to retrieve API key`. The backend no longer validates the key at
  all — requests succeed without it — so the key lookup, its cache and the
  401/403 refresh-and-retry path have been removed.

  Each `search` / `getDetail` call now issues a single request straight to the
  backend, which also makes the library faster and removes its dependency on the
  HTML structure of the homepage.

  `MetacriticService.HOMEPAGE_URL` is now unused and deprecated. It is kept for
  backwards compatibility and will be removed in the next major release.

## 1.2.0

### Minor Changes

- [#1](https://github.com/Deadlock-too/metacritic-ts/pull/1) [`860572b`](https://github.com/Deadlock-too/metacritic-ts/commit/860572b39f53f25ff1d1a5a1c3d1310b8f243d7a) Thanks [@Deadlock-too](https://github.com/Deadlock-too)! - Type-safety, resilience and tooling overhaul:

  - `search()`/`getDetail()` now return discriminated-union results; the constructor and methods accept options objects; the search entry's `criticScore` number became `criticScoreValue`.
  - Added configurable timeouts/retries/`429` handling, an injectable `fetch`, `AbortSignal` support, an injectable `Logger` (silent by default), typed parsing with clear errors, API-key caching with concurrent-call sharing and refresh-on-auth-failure, and improved search matching.
  - Added ESLint + Prettier, separated unit/integration tests, coverage thresholds, an `exports` map, `engines`, `sideEffects`, CI on push/PR, dist smoke tests and Changesets-based releases.

All notable changes to this project are documented in this file. This project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Releases
are managed with [Changesets](https://github.com/changesets/changesets); each
version entry below is generated from the changesets merged for that release.
