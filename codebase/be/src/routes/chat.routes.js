import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middlewares/validate.js'
import { requireAuth } from '../middlewares/auth.js'
import * as chatService from '../services/chat.service.js'

const router = Router()
router.use(requireAuth)

const optionalStr = (max) => z.string().trim().max(max).optional().nullable()

const askSchema = z.object({
  conversationId: z.string().uuid('conversationId không hợp lệ').optional().nullable(),
  question: z.string({ required_error: 'Câu hỏi là bắt buộc' }).trim().min(1, 'Câu hỏi là bắt buộc').max(4000),
  context: optionalStr(8000),
  courseId: optionalStr(50),
  dayId: optionalStr(50),
  partKey: optionalStr(100),
})

const listSchema = z.object({
  courseId: z.string().optional(),
  dayId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

const idSchema = z.object({ id: z.string().uuid('id không hợp lệ') })

// Gửi câu hỏi tới Trợ giảng AI (log cả câu hỏi và phản hồi)
router.post('/ask', validate(askSchema), async (req, res) => {
  res.status(201).json(await chatService.ask(req.userId, req.valid.body))
})

// Danh sách cuộc hội thoại của user (lọc theo khoá học / ngày)
router.get('/conversations', validate(listSchema, 'query'), async (req, res) => {
  res.json({ conversations: await chatService.listConversations(req.userId, req.valid.query) })
})

// Toàn bộ log tin nhắn của một cuộc hội thoại
router.get('/conversations/:id/messages', validate(idSchema, 'params'), async (req, res) => {
  res.json(await chatService.getConversationMessages(req.userId, req.valid.params.id))
})

router.delete('/conversations/:id', validate(idSchema, 'params'), async (req, res) => {
  await chatService.deleteConversation(req.userId, req.valid.params.id)
  res.status(204).end()
})

export default router
