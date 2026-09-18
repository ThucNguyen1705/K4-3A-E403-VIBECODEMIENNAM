// Truy xuất trên chỉ mục eval/index/lesson_chunks.json (167 chunk, 4 bài).
// Nạp một lần vào RAM lúc khởi động — không cần Postgres, không cần vector DB.
//
// RAG lai hai tầng, trộn bằng Reciprocal Rank Fusion:
//   · BM25     — bắt đúng thuật ngữ (temperature, top_p, chunk_size...)
//   · vector   — bắt câu hỏi diễn đạt khác chữ trong bài (eval/index/lesson_embeddings.json)
// Thiếu file vector hoặc API key thì chạy BM25 một mình, app vẫn trả lời được.

import { existsSync, readFileSync } from 'node:fs'
import { embedTexts, hasKey } from './embedding.service.js'

const INDEX_URL = new URL('../../../../eval/index/lesson_chunks.json', import.meta.url)
const EMB_URL = new URL('../../../../eval/index/lesson_embeddings.json', import.meta.url)

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

/**
 * Tổng quan khoá ở mức PHẦN (28 dòng), không phải mức mục (167 dòng). Đủ để router
 * biết phạm vi khoá; chi tiết mục đến từ truy xuất. Phần này tĩnh nên nằm trong
 * system prompt và được prompt cache — đừng chèn gì thay đổi theo lượt vào đây.
 */
export function courseOverview() {
  return index.lessons
    .map((l) => [`${l.dayCode} · ${l.topic}: ${l.summary}`, ...l.parts.map((p) => `   p${p.position} ${p.title}`)].join('\n'))
    .join('\n')
}

// ---------- BM25 ----------

const STOP = new Set([
  'la', 'gi', 'the', 'nao', 'cua', 'va', 'cho', 'khi', 'co', 'khong', 'nhu',
  'mot', 'nhung', 'duoc', 'trong', 'voi', 'tai', 'sao', 'ban', 'minh', 'toi',
  'phai', 'thi', 'ra', 've', 'den', 'tu', 'hay', 'nay', 'do', 'ai', 'em',
  'cac', 'nhieu', 'lam', 'bai', 'nam', 'dau',
])

const fold = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

/** Âm tiết + cặp âm tiết liền nhau — tiếng Việt nghĩa nằm ở từ ghép ("tai lieu", "vector database"). */
function tokenize(s) {
  const words = fold(s).split(/[^a-z0-9_]+/).filter((t) => t.length > 1 && !STOP.has(t))
  const out = [...words]
  for (let i = 1; i < words.length; i++) out.push(`${words[i - 1]} ${words[i]}`)
  return out
}

const K1 = 1.2
const B = 0.75

function buildField(texts) {
  const docs = texts.map((t) => {
    const tf = new Map()
    const toks = tokenize(t)
    for (const tok of toks) tf.set(tok, (tf.get(tok) ?? 0) + 1)
    return { tf, len: toks.length }
  })
  const df = new Map()
  for (const d of docs) for (const tok of d.tf.keys()) df.set(tok, (df.get(tok) ?? 0) + 1)
  const avgLen = docs.reduce((s, d) => s + d.len, 0) / (docs.length || 1)
  const N = docs.length
  const idf = (tok) => {
    const n = df.get(tok) ?? 0
    return Math.log(1 + (N - n + 0.5) / (n + 0.5))
  }
  const score = (i, qToks) => {
    const d = docs[i]
    let s = 0
    for (const tok of qToks) {
      const f = d.tf.get(tok)
      if (!f) continue
      s += idf(tok) * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / avgLen)))
    }
    return s
  }
  return { score }
}

const headField = buildField(index.chunks.map((c) => c.headingPath))
const bodyField = buildField(index.chunks.map((c) => c.content))
const HEAD_WEIGHT = 2

function bm25Rank(queryText) {
  const q = [...new Set(tokenize(queryText))]
  if (!q.length) return []
  const out = []
  index.chunks.forEach((c, i) => {
    const s = HEAD_WEIGHT * headField.score(i, q) + bodyField.score(i, q)
    if (s > 0) out.push({ chunk: c, score: s })
  })
  return out.sort((a, b) => b.score - a.score)
}

/**
 * Tìm từ khoá thuần (đồng bộ, không gọi mạng). Chunk cùng bài đang mở được cộng
 * nhẹ để ưu tiên trả lời tại chỗ.
 */
export function searchChunks(queryText, { dayCode = null, limit = 6 } = {}) {
  return bm25Rank(queryText)
    .map((h) => ({ ...h, score: h.score * (dayCode && h.chunk.dayCode === dayCode ? 1.15 : 1) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

// ---------- Vector ----------

let vectors = null // Map<chunkId, Float32Array>
let embedSpec = null // provider/model/dims ĐÃ DÙNG để dựng chỉ mục — câu hỏi phải nhúng bằng đúng nó
if (existsSync(EMB_URL)) {
  const emb = JSON.parse(readFileSync(EMB_URL, 'utf8'))
  embedSpec = { provider: emb.provider, model: emb.model, dims: emb.dims }
  vectors = new Map(Object.entries(emb.vectors).map(([id, { v }]) => [id, Float32Array.from(v)]))
  const missing = index.chunks.filter((c) => !vectors.has(c.id)).length
  if (missing) console.warn(`[rag] ${missing} chunk chưa có vector — chạy lại src/scripts/build-embeddings.js`)
  if (!hasKey(embedSpec.provider)) {
    console.warn(`[rag] chỉ mục vector dựng bằng ${embedSpec.provider} nhưng thiếu API key — chỉ chạy BM25`)
  }
} else {
  console.warn('[rag] chưa có eval/index/lesson_embeddings.json — chỉ chạy BM25. Chạy src/scripts/build-embeddings.js')
}

export const semanticEnabled = Boolean(vectors && hasKey(embedSpec?.provider))

// Câu hỏi lặp lại (chip gợi ý, eval) không phải nhúng lại
const queryCache = new Map()
const QUERY_CACHE_MAX = 500

/** Nhúng nhiều câu truy vấn trong MỘT lời gọi, bỏ qua câu đã có trong cache. */
async function embedQueries(texts) {
  const keys = texts.map((t) => t.trim().toLowerCase())
  const missing = [...new Set(keys.filter((k) => !queryCache.has(k)))]
  if (missing.length) {
    const vecs = await embedTexts(
      missing.map((k) => texts[keys.indexOf(k)]),
      embedSpec,
      { task: 'query' },
    )
    missing.forEach((k, i) => {
      if (queryCache.size >= QUERY_CACHE_MAX) queryCache.delete(queryCache.keys().next().value)
      queryCache.set(k, vecs[i])
    })
  }
  return keys.map((k) => queryCache.get(k))
}

function vectorRank(qv) {
  const out = []
  for (const c of index.chunks) {
    const v = vectors.get(c.id)
    if (!v) continue
    let dot = 0
    for (let i = 0; i < v.length; i++) dot += v[i] * qv[i]
    out.push({ chunk: c, score: dot })
  }
  return out.sort((a, b) => b.score - a.score)
}

// ---------- Truy xuất lai ----------

const RRF_K = 60
// BM25 nặng 0.7 so với vector: BM25 hay khớp nhầm cụm phổ biến ("tài liệu"), nhưng bỏ hẳn
// thì mất thuật ngữ chính xác (429, top_p). Chọn theo rag-recall.mjs: 0.7 cho MRR cao nhất.
const LEX_W = 0.7
const DAY_BOOST = 0.003 // ≈ đẩy lên vài hạng, không đủ lấn một chunk bài khác khớp hẳn hơn
const EMBED_TIMEOUT_MS = Number(process.env.RAG_EMBED_TIMEOUT_MS ?? 1500)

/** BM25 + vector (nếu có) cho MỘT câu truy vấn, trộn bằng Reciprocal Rank Fusion. */
function hybridRank(text, qv, dayCode) {
  const lexical = bm25Rank(text).slice(0, 50)
  const semantic = qv ? vectorRank(qv).slice(0, 50) : []

  const fused = new Map()
  const add = (list, w = 1) =>
    list.forEach((h, rank) => {
      const cur = fused.get(h.chunk.id) ?? { chunk: h.chunk, score: 0, sim: null }
      cur.score += w / (RRF_K + rank + 1)
      fused.set(h.chunk.id, cur)
    })
  add(lexical, LEX_W)
  add(semantic)
  for (const h of semantic) fused.get(h.chunk.id).sim = h.score
  if (dayCode) for (const h of fused.values()) if (h.chunk.dayCode === dayCode) h.score += DAY_BOOST

  return [...fused.values()].sort((a, b) => b.score - a.score)
}

/**
 * Truy xuất top-k ứng viên cho router — thay cho việc nhét cả mục lục vào prompt.
 *
 * Câu hỏi và đoạn bôi đen được truy xuất RIÊNG rồi xen kẽ, câu hỏi đi trước.
 * Gộp chung thành một truy vấn thì đoạn bôi đen dài (luôn thuộc bài đang mở) lấn át
 * câu hỏi ngắn: học viên đang bôi đen ở D02 hỏi "vector database hoạt động thế nào"
 * sẽ không thấy chunk D03 nào — đúng loại câu chéo bài mà router phải bắt được.
 * Xen kẽ thì câu hỏi luôn giữ nửa số suất, còn câu cụt ("giải thích") vẫn có
 * ứng viên từ đoạn bôi đen.
 *
 * @returns {Promise<{hits: {chunk, score, sim: number|null}[], mode: 'hybrid'|'bm25', topSim: number|null}>}
 */
export async function retrieve(question, { context = null, dayCode = null, k = 10 } = {}) {
  const texts = [question, context].filter((t) => t && t.trim())
  if (!texts.length) return { hits: [], mode: 'bm25', topSim: null }

  let vecs = []
  let mode = 'bm25'
  if (semanticEnabled) {
    // Embedding API đo được p50 ~0,8 s, đuôi 2–5 s. Quá hạn thì đi tiếp bằng BM25 (nới k),
    // không bắt học viên chờ; kết quả về muộn vẫn vào cache cho lượt sau.
    const pending = embedQueries(texts)
    pending.catch(() => {}) // tránh unhandled rejection khi đã bỏ cuộc vì quá hạn
    let timer
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`quá ${EMBED_TIMEOUT_MS} ms`)), EMBED_TIMEOUT_MS)
    })
    try {
      vecs = await Promise.race([pending, deadline])
      mode = 'hybrid'
    } catch (e) {
      console.warn('[rag] nhúng câu hỏi lỗi, chỉ dùng BM25:', e.message)
    } finally {
      clearTimeout(timer)
    }
  }

  const lists = texts.map((t, i) => hybridRank(t, vecs[i], dayCode))
  // BM25 một mình xếp hạng kém hơn hẳn (rag-recall.mjs: cần k=20 mới đủ recall như hybrid k=6),
  // nên khi mất tầng vector thì nới gấp đôi số ứng viên thay vì để router thiếu căn cứ.
  const limit = mode === 'hybrid' ? k : k * 2

  const seen = new Set()
  const hits = []
  for (let rank = 0; hits.length < limit && lists.some((l) => rank < l.length); rank++) {
    for (const l of lists) {
      const h = l[rank]
      if (!h || seen.has(h.chunk.id) || hits.length >= limit) continue
      seen.add(h.chunk.id)
      hits.push(h)
    }
  }

  const sims = lists[0].map((h) => h.sim).filter((x) => x !== null)
  return { hits, mode, topSim: sims.length ? Math.max(...sims) : null }
}

/** Dùng cho locate_content: gom kết quả theo phần, mỗi phần lấy chỗ khớp nhất. */
export async function locate(question, { limit = 5 } = {}) {
  const { hits } = await retrieve(question, { k: 30 })
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
