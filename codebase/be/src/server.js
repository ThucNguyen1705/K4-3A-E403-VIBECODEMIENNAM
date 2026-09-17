import { app } from './app.js'
import { config } from './config.js'
import { pool } from './db.js'

// Express 5 truyền lỗi listen (vd EADDRINUSE) vào callback thay vì throw
const server = app.listen(config.port, (err) => {
  if (err) {
    console.error(
      err.code === 'EADDRINUSE'
        ? `❌ Cổng ${config.port} đang được dùng bởi tiến trình khác — tắt nó hoặc đổi PORT trong .env`
        : `❌ Không khởi động được server: ${err.message}`,
    )
    process.exit(1)
  }
  console.log(`🚀 VLearn API chạy tại http://localhost:${config.port}/api`)
})

const shutdown = () => {
  server.close(() => pool.end().then(() => process.exit(0)))
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
