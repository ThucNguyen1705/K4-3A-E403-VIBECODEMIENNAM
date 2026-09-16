import { app } from './app.js'
import { config } from './config.js'
import { pool } from './db.js'

const server = app.listen(config.port, () => {
  console.log(`🚀 VLearn API chạy tại http://localhost:${config.port}/api`)
})

const shutdown = () => {
  server.close(() => pool.end().then(() => process.exit(0)))
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
