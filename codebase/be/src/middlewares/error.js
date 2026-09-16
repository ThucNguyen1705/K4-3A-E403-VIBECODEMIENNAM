import { config } from '../config.js'
import { HttpError } from '../utils/HttpError.js'

export function notFound(req) {
  throw new HttpError(404, `Không tìm thấy ${req.method} ${req.originalUrl}`)
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  // JSON body sai cú pháp
  if (err.type === 'entity.parse.failed') err = new HttpError(400, 'JSON không hợp lệ')

  const status = err instanceof HttpError ? err.status : 500
  if (status >= 500) console.error(err)

  res.status(status).json({
    error: {
      message: status >= 500 && config.env === 'production' ? 'Lỗi máy chủ' : err.message,
      ...(err.details && { details: err.details }),
    },
  })
}
