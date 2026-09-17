// ============================================================
// Dựng chỉ mục tri thức để truy xuất và TRÍCH DẪN CHÍNH XÁC.
//
// Cắt mỗi file seed-data/<course>/<dayCode>.md thành chunk theo cấu trúc tiêu đề:
//     "# Phần"  ->  part      "## Mục"  ->  section (một chunk)
// Mỗi chunk có một MÃ TRÍCH DẪN ổn định: D01#p2#s3
//
//   node src/scripts/build-index.js            # ghi ra file JSON, xem trước
//   node src/scripts/build-index.js --db       # ghi luôn vào bảng lesson_chunks
//
// Vì sao phải có bước này: nội dung bài học KHÔNG có số trang. Bắt model ghi
// "[Trang N]" thì nó sẽ bịa ra số trang — đúng cái lỗi đang muốn sửa. Mã trích
// dẫn phải trỏ về một thứ có thật trong database và kiểm lại được bằng code.
// ============================================================

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { courses } from './seed-data/courses.js'

const FENCE = /^\s*(```|~~~)/
const H1 = /^# (.+)$/
const H2 = /^## (.+)$/

const OUT_PATH = fileURLToPath(new URL('../../../../eval/index/lesson_chunks.json', import.meta.url))

/**
 * Cắt markdown thành chunk. Dòng bắt đầu bằng # hoặc ## nằm TRONG khối code
 * không tính là tiêu đề — nếu không thì mọi comment Python sẽ thành một phần mới.
 */
export function chunkMarkdown(markdown, { courseId, dayCode }) {
  const chunks = []
  let partIndex = 0
  let partTitle = null
  let secIndex = 0
  let secTitle = null
  let buffer = []
  let fence = null

  const flush = () => {
    const content = buffer.join('\n').trim()
    buffer = []
    if (!partTitle || !content) return
    chunks.push({
      id: `${dayCode}#p${partIndex}#s${secIndex}`,
      courseId,
      dayCode,
      partPosition: partIndex,
      partTitle,
      secPosition: secIndex,
      secTitle,
      headingPath: [dayCode, partTitle, secTitle].filter(Boolean).join(' › '),
      content,
      charLen: content.length,
    })
  }

  for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const fenceMatch = line.match(FENCE)
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1]
      else if (fenceMatch[1] === fence) fence = null
      buffer.push(line)
      continue
    }

    if (!fence) {
      const h1 = line.match(H1)
      if (h1) {
        flush()
        partIndex += 1
        partTitle = h1[1].trim()
        secIndex = 1
        secTitle = null // phần mở đầu trước mục ## đầu tiên
        continue
      }
      const h2 = line.match(H2)
      if (h2 && partTitle) {
        flush()
        secIndex += 1
        secTitle = h2[1].trim()
        continue
      }
    }

    buffer.push(line)
  }
  flush()
  return chunks
}

// ---------- Dựng chỉ mục cho toàn bộ khoá học ----------

const allChunks = []
const lessonIndex = []

for (const course of courses) {
  for (const lesson of course.lessons) {
    const url = new URL(`./seed-data/${course.id}/${lesson.dayCode}.md`, import.meta.url)
    const chunks = chunkMarkdown(readFileSync(url, 'utf8'), {
      courseId: course.id,
      dayCode: lesson.dayCode,
    })
    allChunks.push(...chunks)

    // Bản đồ bài học: dùng cho định tuyến chéo bài và cho câu hỏi "cái này nằm ở đâu"
    // Giữ NGUYÊN secPosition thật. Phần mở đầu rỗng bị bỏ qua lúc cắt chunk nên
    // số thứ tự không liên tục — đánh số lại từ 1 là mục lục lệch với mã thật.
    const parts = []
    for (const c of chunks) {
      const section = { position: c.secPosition, title: c.secTitle ?? '(mở đầu)' }
      const last = parts[parts.length - 1]
      if (last && last.position === c.partPosition) last.sections.push(section)
      else parts.push({ position: c.partPosition, title: c.partTitle, sections: [section] })
    }
    lessonIndex.push({
      courseId: course.id,
      dayCode: lesson.dayCode,
      title: lesson.title,
      topic: lesson.topic,
      summary: lesson.summary,
      chunkCount: chunks.length,
      parts,
    })
  }
}

const payload = {
  builtAt: new Date().toISOString(),
  chunkCount: allChunks.length,
  lessons: lessonIndex,
  chunks: allChunks,
}

mkdirSync(dirname(OUT_PATH), { recursive: true })
writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2), 'utf8')

const lens = allChunks.map((c) => c.charLen).sort((a, b) => a - b)
const at = (q) => lens[Math.floor(lens.length * q)]
console.log(`✅ ${allChunks.length} chunk từ ${lessonIndex.length} bài học`)
console.log(`   độ dài: p25=${at(0.25)} · trung vị=${at(0.5)} · p95=${at(0.95)} · max=${lens[lens.length - 1]} ký tự`)
console.log(`   → ${OUT_PATH}`)
for (const l of lessonIndex) {
  console.log(`   ${l.dayCode} · ${l.topic} — ${l.parts.length} phần, ${l.chunkCount} chunk`)
}

// ---------- Ghi vào database (tuỳ chọn) ----------

if (process.argv.includes('--db')) {
  const { pool, withTransaction } = await import('../db.js')
  await withTransaction(async (client) => {
    await client.query(`DELETE FROM lesson_chunks WHERE NOT (id = ANY($1))`, [allChunks.map((c) => c.id)])
    for (const c of allChunks) {
      await client.query(
        `INSERT INTO lesson_chunks
           (id, course_id, day_code, part_position, part_title, sec_position, sec_title,
            heading_path, content, char_len, search_tsv)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                 setweight(to_tsvector('simple', $8), 'A') ||
                 setweight(to_tsvector('simple', $9), 'B'))
         ON CONFLICT (id) DO UPDATE SET
           part_title = EXCLUDED.part_title, sec_title = EXCLUDED.sec_title,
           heading_path = EXCLUDED.heading_path, content = EXCLUDED.content,
           char_len = EXCLUDED.char_len, search_tsv = EXCLUDED.search_tsv,
           updated_at = now()`,
        [
          c.id, c.courseId, c.dayCode, c.partPosition, c.partTitle,
          c.secPosition, c.secTitle, c.headingPath, c.content, c.charLen,
        ],
      )
    }
  })
  console.log(`✅ Đã ghi ${allChunks.length} chunk vào bảng lesson_chunks`)
  await pool.end()
}
