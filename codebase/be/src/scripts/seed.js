// Seed dữ liệu: tài khoản demo + khoá học / ngày học / nội dung bài học.
// Chạy lại nhiều lần an toàn: nội dung khoá học được đồng bộ theo src/scripts/seed-data/courses.js
import bcrypt from 'bcryptjs'
import { pool, withTransaction } from '../db.js'
import { courses } from './seed-data/courses.js'

// ---------- Tài khoản demo ----------
const hash = await bcrypt.hash('123456', 10)
await pool.query(
  `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
   ON CONFLICT (lower(email)) DO NOTHING`,
  ['Nguyễn Văn Tài', 'demo@vlearn.dev', hash],
)

// ---------- Khoá học ----------
let lessonCount = 0
let partCount = 0

await withTransaction(async (client) => {
  for (const [ci, course] of courses.entries()) {
    await client.query(
      `INSERT INTO courses (id, code, title, description, position)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE
         SET code = EXCLUDED.code, title = EXCLUDED.title, description = EXCLUDED.description,
             position = EXCLUDED.position, updated_at = now()`,
      [course.id, course.code, course.title, course.description, ci + 1],
    )

    // Upsert theo (course_id, day_code) và (lesson_id, position) để id giữ nguyên giữa các lần seed
    const dayCodes = course.lessons.map((l) => l.dayCode)
    await client.query(`DELETE FROM lessons WHERE course_id = $1 AND NOT (day_code = ANY($2))`, [course.id, dayCodes])

    for (const [li, lesson] of course.lessons.entries()) {
      const { rows } = await client.query(
        `INSERT INTO lessons (course_id, day_code, position, title, topic, summary)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (course_id, day_code) DO UPDATE
           SET position = EXCLUDED.position, title = EXCLUDED.title, topic = EXCLUDED.topic,
               summary = EXCLUDED.summary, updated_at = now()
         RETURNING id`,
        [course.id, lesson.dayCode, li + 1, lesson.title, lesson.topic, lesson.summary],
      )
      const lessonId = rows[0].id
      lessonCount++

      await client.query(`DELETE FROM lesson_parts WHERE lesson_id = $1 AND position > $2`, [
        lessonId,
        lesson.parts.length,
      ])
      for (const [pi, part] of lesson.parts.entries()) {
        await client.query(
          `INSERT INTO lesson_parts (lesson_id, position, title, content) VALUES ($1, $2, $3, $4)
           ON CONFLICT (lesson_id, position) DO UPDATE
             SET title = EXCLUDED.title, content = EXCLUDED.content, updated_at = now()`,
          [lessonId, pi + 1, part.title, part.content],
        )
        partCount++
      }
    }
  }
  // Xoá khoá học không còn trong file seed
  await client.query(`DELETE FROM courses WHERE NOT (id = ANY($1))`, [courses.map((c) => c.id)])
})

console.log(`✅ Seed xong: demo@vlearn.dev / 123456 · ${courses.length} khoá · ${lessonCount} ngày học · ${partCount} phần nội dung`)
await pool.end()
