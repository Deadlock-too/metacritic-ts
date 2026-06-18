---
'metacritic-ts': minor
---

Type-safety, resilience and tooling overhaul:

- `search()`/`getDetail()` now return discriminated-union results; the constructor and methods accept options objects; the search entry's `criticScore` number became `criticScoreValue`.
- Added configurable timeouts/retries/`429` handling, an injectable `fetch`, `AbortSignal` support, an injectable `Logger` (silent by default), typed parsing with clear errors, API-key caching with concurrent-call sharing and refresh-on-auth-failure, and improved search matching.
- Added ESLint + Prettier, separated unit/integration tests, coverage thresholds, an `exports` map, `engines`, `sideEffects`, CI on push/PR, dist smoke tests and Changesets-based releases.
