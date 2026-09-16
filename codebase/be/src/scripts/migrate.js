// Áp dụng schema db/init.sql (idempotent) lên database hiện tại
import { readFile } from 'node:fs/promises'
import { pool } from '../db.js'

const sql = await readFile(new URL('../../db/init.sql', import.meta.url), 'utf8')
await pool.query(sql)
console.log('✅ Migrate xong')
await pool.end()
