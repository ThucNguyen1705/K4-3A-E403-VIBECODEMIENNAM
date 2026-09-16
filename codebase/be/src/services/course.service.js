import { query } from '../db.js'
import { HttpError } from '../utils/HttpError.js'

const toCourse = (r) => ({
  id: r.id,
  code: r.code,
  title: r.title,
  description: r.description,
  position: r.position,
})

const toLessonSummary = (r) => ({
  id: r.id,
  courseId: r.course_id,
  dayCode: r.day_code,
  position: r.position,
  title: r.title,
  topic: r.topic,
  summary: r.summary,
  partCount: Number(r.part_count ?? 0),
})

const LESSON_SUMMARY_SQL = `
  SELECT l.*, COUNT(p.id) AS part_count
    FROM lessons l
    LEFT JOIN lesson_parts p ON p.lesson_id = l.id
   WHERE l.course_id = ANY($1)
   GROUP BY l.id
   ORDER BY l.course_id, l.position`

// Danh sách khoá học kèm danh sách ngày học (không kèm nội dung)
export async function listCourses() {
  const { rows: courseRows } = await query(`SELECT * FROM courses ORDER BY position, title`)
  if (courseRows.length === 0) return []

  const { rows: lessonRows } = await query(LESSON_SUMMARY_SQL, [courseRows.map((c) => c.id)])
  return courseRows.map((c) => ({
    ...toCourse(c),
    lessons: lessonRows.filter((l) => l.course_id === c.id).map(toLessonSummary),
  }))
}

export async function getCourse(courseId) {
  const { rows } = await query(`SELECT * FROM courses WHERE id = $1`, [courseId])
  if (!rows[0]) throw new HttpError(404, 'Không tìm thấy khoá học')
  return toCourse(rows[0])
}

export async function listLessons(courseId) {
  await getCourse(courseId)
  const { rows } = await query(LESSON_SUMMARY_SQL, [[courseId]])
  return rows.map(toLessonSummary)
}

// Chi tiết một ngày học kèm toàn bộ phần nội dung
export async function getLesson(courseId, dayCode) {
  const course = await getCourse(courseId)
  const { rows } = await query(`SELECT * FROM lessons WHERE course_id = $1 AND day_code = $2`, [courseId, dayCode])
  const lesson = rows[0]
  if (!lesson) throw new HttpError(404, 'Không tìm thấy ngày học')

  const { rows: parts } = await query(
    `SELECT id, position, title, content FROM lesson_parts WHERE lesson_id = $1 ORDER BY position`,
    [lesson.id],
  )

  return {
    course,
    ...toLessonSummary({ ...lesson, part_count: parts.length }),
    parts: parts.map((p) => ({ id: p.id, position: p.position, title: p.title, content: p.content })),
  }
}
