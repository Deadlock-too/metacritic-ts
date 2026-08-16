// Verifies the published CommonJS entrypoint loads and exports the public API.
const assert = require('node:assert')
const { HttpError, MetacriticService, RecordType, ScraperError } = require('../dist/index.cjs')

assert.strictEqual(typeof MetacriticService, 'function')
assert.strictEqual(typeof new MetacriticService().search, 'function')
assert.strictEqual(typeof new MetacriticService().getDetail, 'function')
assert.ok('Game' in RecordType)
assert.ok(new HttpError('boom', 403) instanceof ScraperError)
assert.strictEqual(new HttpError('boom', 403).status, 403)
console.log('CJS smoke test passed')
