import bcrypt from 'bcryptjs'
import { query } from '../db.js'
import { signToken } from '../middlewares/auth.js'
import { HttpError } from '../utils/HttpError.js'

const toPublicUser = (row) => ({ id: row.id, email: row.email, name: row.name, createdAt: row.created_at })

export async function register({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, 10)
  try {
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [name, email, passwordHash],
    )
    const user = toPublicUser(rows[0])
    return { token: signToken(user), user }
  } catch (err) {
    if (err.code === '23505') throw new HttpError(409, 'Email này đã được đăng ký')
    throw err
  }
}

export async function login({ email, password }) {
  const { rows } = await query(
    `SELECT id, email, name, password_hash, created_at FROM users WHERE lower(email) = lower($1)`,
    [email],
  )
  const row = rows[0]
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    throw new HttpError(401, 'Email hoặc mật khẩu không đúng')
  }
  const user = toPublicUser(row)
  return { token: signToken(user), user }
}

export async function getUserById(id) {
  const { rows } = await query(`SELECT id, email, name, created_at FROM users WHERE id = $1`, [id])
  if (!rows[0]) throw new HttpError(401, 'Tài khoản không tồn tại')
  return toPublicUser(rows[0])
}
