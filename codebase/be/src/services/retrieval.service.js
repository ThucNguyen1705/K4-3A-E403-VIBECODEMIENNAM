// Truy xuất trên chỉ mục eval/index/lesson_chunks.json (167 chunk, 4 bài).
// Nạp một lần vào RAM lúc khởi động — không cần Postgres, không cần vector DB.

import { readFileSync } from 'node:fs'

const INDEX_URL = new URL('../../../../eval/index/lesson_chunks.json', import.meta.url)

const index = JSON.parse(readFileSync(INDEX_URL, 'utf8'))
const byId = new Map(index.chunks.map((c) => [c.id, c]))

export const chunkCount = index.chunks.length
export const lessons = index.lessons

export const chunkById = (id) => byId.get(id) ?? null
export const chunksByIds = (ids = []) => ids.map(chunkById).filter(Boolean)

/**
 * Đường dẫn mở đúng phần trong trang học.
 * Khớp route của FE: /course/:courseId/day/:dayId, chọn phần bằng ?partPos=
 * (dùng số thứ tự chứ không dùng UUID vì chỉ mục này không biết id trong DB).
 */
export const deepLink = (c) => `/course/${c.courseId}/day/${c.dayCode}?partPos=${c.partPosition}`

/** Nhãn hiển thị cho học viên — không bao giờ show mã thô ra UI. */
export const citationLabel = (c) => c.headingPath

export function toCitation(c) {
  return {
    id: c.id,
    dayCode: c.dayCode,
    label: c.headingPath,
    partTitle: c.partTitle,
    secTitle: c.secTitle,
    link: deepLink(c),
  }
}

// ---------- Mục lục cho router ----------
// 167 tiêu đề gói trong ~8KB. Router nhìn hết bản đồ khoá học trong một lời gọi,
// nên phát hiện câu hỏi thuộc bài khác là việc của nó, không cần semantic search.

let catalogCache = null

export function lessonCatalog() {
  if (catalogCache) return catalogCache

  const lines = ['Mã chunk có dạng <Day>#p<phần>#s<mục>. Chỉ được dùng mã có trong danh sách này.', '']
  for (const lesson of index.lessons) {
    lines.push(`### ${lesson.dayCode} — ${lesson.topic}`)
    for (const part of lesson.parts) {
      lines.push(`p${part.position} ${part.title}`)
      // In đúng secPosition thật, không đánh số lại theo vị trí mảng
      const secs = part.sections.map((s) => `s${s.position} ${s.title}`).join(' · ')
      lines.push(`   ${secs}`)
    }
    lines.push('')
  }
  catalogCache = lines.join('\n')
  return catalogCache
}

// ---------- Tìm kiếm từ khoá: lưới an toàn khi router chọn hụt ----------

const STOP = new Set([
  'la', 'gi', 'the', 'nao', 'cua', 'va', 'cho', 'khi', 'co', 'khong', 'nhu',
  'mot', 'nhung', 'duoc', 'trong', 'voi', 'tai', 'sao', 'ban', 'minh', 'toi',
  'phai', 'thi', 'ra', 've', 'den', 'tu', 'hay', 'nay', 'do', 'ai', 'em',
])

const fold = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

const terms = (s) => [...new Set(fold(s).split(/[^a-z0-9]+/).filter((t) => t.length > 1 && !STOP.has(t)))]

const searchable = new Map(
  index.chunks.map((c) => [c.id, { head: fold(c.headingPath), body: fold(c.content) }]),
)

/**
 * Chấm điểm theo số từ khoá khớp: tiêu đề nặng gấp 3 lần thân bài.
 * Chunk cùng bài đang mở được cộng thêm để ưu tiên trả lời tại chỗ.
 */
export function searchChunks(queryText, { dayCode = null, limit = 6 } = {}) {
  const ts = terms(queryText)
  if (!ts.length) return []

  const scored = []
  for (const c of index.chunks) {
    const s = searchable.get(c.id)
    let score = 0
    for (const t of ts) {
      if (s.head.includes(t)) score += 3
      if (s.body.includes(t)) score += 1
    }
    if (!score) continue
    if (dayCode && c.dayCode === dayCode) score += 2
    scored.push({ chunk: c, score })
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit)
}

/** Dùng cho locate_content: gom kết quả theo bài, mỗi bài lấy chỗ khớp nhất. */
export function locate(queryText, { limit = 5 } = {}) {
  const hits = searchChunks(queryText, { limit: 40 })
  const seen = new Set()
  const out = []
  for (const h of hits) {
    const key = `${h.chunk.dayCode}#p${h.chunk.partPosition}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(h)
    if (out.length >= limit) break
  }
  return out
}
