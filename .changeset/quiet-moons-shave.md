---
'metacritic-ts': minor
---

Report what kind of failure occurred, and stop naming the wrong subsystem

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
