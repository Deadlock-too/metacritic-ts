// Verifies the published ESM entrypoint loads and exports the public API.
import assert from 'node:assert'
import { HttpError, MetacriticService, RecordType, ScraperError } from '../dist/index.mjs'

assert.strictEqual(typeof MetacriticService, 'function')
assert.strictEqual(typeof new MetacriticService().search, 'function')
assert.strictEqual(typeof new MetacriticService().getDetail, 'function')
assert.ok('Game' in RecordType)
assert.ok(new HttpError('boom', 403) instanceof ScraperError)
assert.strictEqual(new HttpError('boom', 403).status, 403)
console.log('ESM smoke test passed')
