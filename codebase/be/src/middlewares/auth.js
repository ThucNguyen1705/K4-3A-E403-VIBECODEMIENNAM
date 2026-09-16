import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { HttpError } from '../utils/HttpError.js'

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, { expiresIn: config.jwtExpiresIn })
}

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) throw new HttpError(401, 'Bạn cần đăng nhập')

  try {
    const payload = jwt.verify(token, config.jwtSecret)
    req.userId = payload.sub
    next()
  } catch {
    throw new HttpError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn')
  }
}
