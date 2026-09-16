import { HttpError } from '../utils/HttpError.js'

// validate(schema, 'body' | 'query' | 'params') — kết quả đã parse gắn vào req.valid
export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? {})
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      throw new HttpError(400, details[0]?.message ?? 'Dữ liệu không hợp lệ', details)
    }
    req.valid = { ...req.valid, [source]: result.data }
    next()
  }
