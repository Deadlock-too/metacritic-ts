// Verifies the published ESM entrypoint loads and exports the public API.
import assert from 'node:assert'
import { MetacriticService, RecordType } from '../dist/index.mjs'

assert.strictEqual(typeof MetacriticService, 'function')
assert.strictEqual(typeof new MetacriticService().search, 'function')
assert.strictEqual(typeof new MetacriticService().getDetail, 'function')
assert.ok('Game' in RecordType)
console.log('ESM smoke test passed')
