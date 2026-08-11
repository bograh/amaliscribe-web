import { createDatabaseClient } from './lib/db'
const c = createDatabaseClient()
const r = await c.execute("SELECT name FROM sqlite_master WHERE type IN ('table','index') ORDER BY name")
console.log('objects:', r.rows.map(x => x.name))
