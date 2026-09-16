import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { config } from './config.js'
import { pool } from './db.js'
import authRoutes from './routes/auth.routes.js'
import chatRoutes from './routes/chat.routes.js'
import courseRoutes from './routes/course.routes.js'
import { errorHandler, notFound } from './middlewares/error.js'

export const app = express()

app.use(cors({ origin: config.corsOrigin }))
app.use(express.json({ limit: '1mb' }))
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'))

app.get('/api/health', async (_req, res) => {
  let db = 'up'
  try {
    await pool.query('SELECT 1')
  } catch {
    db = 'down'
  }
  res.status(db === 'up' ? 200 : 503).json({ status: 'ok', db })
})

app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/chat', chatRoutes)

app.use(notFound)
app.use(errorHandler)
