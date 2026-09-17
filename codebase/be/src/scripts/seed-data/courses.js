// ============================================================
// Dữ liệu seed cho khoá học.
// - Thông tin khoá / ngày học khai báo ở file này
// - Nội dung mỗi ngày nằm trong seed-data/<courseId>/<dayCode>.md
//   Mỗi dòng "# Tiêu đề" (ngoài khối code) bắt đầu một phần nội dung mới.
// Sửa xong chạy `npm run seed` để đồng bộ vào database.
// ============================================================
import { readFileSync } from 'node:fs'

const FENCE = /^\s*(```|~~~)/

// Tách markdown thành các phần theo heading cấp 1, bỏ qua dòng "#" nằm trong khối code
export function parseParts(markdown) {
  const parts = []
  let current = null
  let fence = null

  for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const fenceMatch = line.match(FENCE)
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1]
      else if (fenceMatch[1] === fence) fence = null
    }

    const heading = !fence && !fenceMatch && line.match(/^# (.+)$/)
    if (heading) {
      current = { title: heading[1].trim(), lines: [] }
      parts.push(current)
    } else if (current) {
      current.lines.push(line)
    }
  }

  return parts.map((p) => ({ title: p.title, content: p.lines.join('\n').trim() }))
}

const loadParts = (courseId, dayCode) =>
  parseParts(readFileSync(new URL(`./${courseId}/${dayCode}.md`, import.meta.url), 'utf8'))

const course = (meta) => ({
  ...meta,
  lessons: meta.lessons.map((l) => ({ ...l, parts: loadParts(meta.id, l.dayCode) })),
})

export const courses = [
  course({
    id: 'k4p1',
    code: 'L3-L4',
    title: 'L3-L4 - Khóa 4 Phase 1',
    description: 'Nền tảng xây dựng sản phẩm AI: LLM API, Prompt Engineering, Embedding và RAG.',
    lessons: [
      {
        dayCode: 'D01',
        title: 'Day01',
        topic: 'Nền tảng LLM API',
        summary:
          'Từ lời gọi LLM API đầu tiên đến trợ lý hội thoại CLI: token, tham số sinh, chi phí, streaming, lịch sử và retry.',
      },
      {
        dayCode: 'D02',
        title: 'Day02',
        topic: 'Prompt Engineering thực chiến',
        summary:
          'Viết prompt có cấu trúc, system prompt, few-shot, suy luận từng bước, JSON có validate, đánh giá prompt và prompt injection.',
      },
      {
        dayCode: 'D03',
        title: 'Day03',
        topic: 'Embedding & Vector Database',
        summary:
          'Biểu diễn ý nghĩa văn bản bằng vector, đo độ tương đồng, xây tìm kiếm ngữ nghĩa, ANN/HNSW, pgvector và hybrid search.',
      },
      {
        dayCode: 'D04',
        title: 'Day04',
        topic: 'Retrieval-Augmented Generation (RAG)',
        summary:
          'Pipeline RAG hoàn chỉnh: chunking, truy xuất nâng cao, prompt có trích dẫn và từ chối, đánh giá hai tầng, mini-project trợ giảng.',
      },
    ],
  }),
]
