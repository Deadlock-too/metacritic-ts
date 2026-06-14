// Verifies the published CommonJS entrypoint loads and exports the public API.
const assert = require('node:assert')
const { MetacriticService, RecordType } = require('../dist/index.cjs')

assert.strictEqual(typeof MetacriticService, 'function')
assert.strictEqual(typeof new MetacriticService().search, 'function')
assert.strictEqual(typeof new MetacriticService().getDetail, 'function')
assert.ok('Game' in RecordType)
console.log('CJS smoke test passed')
