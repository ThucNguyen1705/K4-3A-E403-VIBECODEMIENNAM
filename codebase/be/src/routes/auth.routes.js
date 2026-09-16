import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middlewares/validate.js'
import { requireAuth } from '../middlewares/auth.js'
import * as authService from '../services/auth.service.js'

const router = Router()

const email = z.string({ required_error: 'Email là bắt buộc' }).trim().toLowerCase().email('Email không hợp lệ')

const registerSchema = z.object({
  name: z.string({ required_error: 'Họ tên là bắt buộc' }).trim().min(2, 'Họ tên tối thiểu 2 ký tự').max(100),
  email,
  password: z.string({ required_error: 'Mật khẩu là bắt buộc' }).min(6, 'Mật khẩu tối thiểu 6 ký tự').max(100),
})

const loginSchema = z.object({
  email,
  password: z.string({ required_error: 'Mật khẩu là bắt buộc' }).min(1, 'Mật khẩu là bắt buộc'),
})

router.post('/register', validate(registerSchema), async (req, res) => {
  res.status(201).json(await authService.register(req.valid.body))
})

router.post('/login', validate(loginSchema), async (req, res) => {
  res.json(await authService.login(req.valid.body))
})

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: await authService.getUserById(req.userId) })
})

export default router
