# Changelog

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
