# Changelog

All notable changes to this project are documented in this file. This project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Going
forward, releases are managed with [Changesets](https://github.com/changesets/changesets).

## 2.0.0

### Breaking changes

- `search()` and `getDetail()` now return discriminated unions (`{ success: true, data } | { success: false, error }`).
  On failure there is no longer a `data` field — narrow on `success` first.
- The constructor now also accepts an options object: `new MetacriticService({ minSimilarity, timeout, retries, fetch, logger, ... })`.
  Passing a bare `number` (the old `minSimilarity` argument) is still supported.
- `search()` / `getDetail()` take their extra arguments via an options object: `search(key, { recordType, sortBySimilarity, signal })`.
- `MetacriticSearchEntry.criticScore` (a bare number) was renamed to `criticScoreValue` to disambiguate it from `MetacriticEntry.criticScore`, which is a structured `Score`.
- The library no longer writes to `console`. Pass `consoleLogger` (or your own `Logger`) to observe diagnostics.

### Added

- Configurable HTTP behaviour: per-request `timeout`, automatic `retries` with exponential backoff, `429 Retry-After` handling, an injectable `fetch`, and `AbortSignal` propagation.
- The API key is cached, shared across concurrent calls, and automatically refreshed and retried once after an auth failure.
- Typed parsing with clear `ScraperError` messages when the Metacritic page structure changes.
- Improved search matching (`getMatchScore`) so short queries still match longer titles, with title normalisation (accents/punctuation).
- Proper ESM/CJS `exports` map, `engines`, and `sideEffects: false` for better bundling.
