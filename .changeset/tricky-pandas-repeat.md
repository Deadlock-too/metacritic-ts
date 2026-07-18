---
'metacritic-ts': patch
---

Stop scraping the Metacritic homepage for an API key.

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
