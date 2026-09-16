import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middlewares/validate.js'
import { requireAuth } from '../middlewares/auth.js'
import * as courseService from '../services/course.service.js'

const router = Router()
router.use(requireAuth)

const courseParams = z.object({ courseId: z.string().trim().min(1).max(50) })
const lessonParams = courseParams.extend({ dayCode: z.string().trim().min(1).max(50) })

// Danh sách khoá học + danh sách ngày học của từng khoá
router.get('/', async (_req, res) => {
  res.json({ courses: await courseService.listCourses() })
})

router.get('/:courseId', validate(courseParams, 'params'), async (req, res) => {
  const { courseId } = req.valid.params
  const [course, lessons] = await Promise.all([courseService.getCourse(courseId), courseService.listLessons(courseId)])
  res.json({ course: { ...course, lessons } })
})

// Danh sách ngày học của một khoá
router.get('/:courseId/lessons', validate(courseParams, 'params'), async (req, res) => {
  res.json({ lessons: await courseService.listLessons(req.valid.params.courseId) })
})

// Chi tiết một ngày học kèm các phần nội dung
router.get('/:courseId/lessons/:dayCode', validate(lessonParams, 'params'), async (req, res) => {
  const { courseId, dayCode } = req.valid.params
  res.json({ lesson: await courseService.getLesson(courseId, dayCode) })
})

export default router
