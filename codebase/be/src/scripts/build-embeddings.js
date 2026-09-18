// ============================================================
// Nhúng vector cho chỉ mục chunk — tầng ngữ nghĩa của RAG.
//
//   node --env-file=.env src/scripts/build-index.js        # cắt chunk trước
//   node --env-file=.env src/scripts/build-embeddings.js   # rồi nhúng
//
// Chạy lại chỉ nhúng chunk có nội dung đổi (so hash), nên sửa một bài không
// tốn tiền nhúng lại cả khoá. Đổi model/số chiều thì nhúng lại toàn bộ.
// ============================================================

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildModel, embedTexts } from '../services/embedding.service.js'

const INDEX_PATH = fileURLToPath(new URL('../../../../eval/index/lesson_chunks.json', import.meta.url))
const OUT_PATH = fileURLToPath(new URL('../../../../eval/index/lesson_embeddings.json', import.meta.url))
const BATCH = 64

const embedText = (c) => `${c.headingPath}\n\n${c.content}`
const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 16)

const index = JSON.parse(readFileSync(INDEX_PATH, 'utf8'))
const prev = existsSync(OUT_PATH) ? JSON.parse(readFileSync(OUT_PATH, 'utf8')) : null
const sameModel =
  prev &&
  prev.provider === buildModel.provider &&
  prev.model === buildModel.model &&
  prev.dims === buildModel.dims

const vectors = {}
const todo = []
for (const c of index.chunks) {
  const h = hash(embedText(c))
  const old = sameModel ? prev.vectors[c.id] : null
  if (old && old.hash === h) vectors[c.id] = old
  else todo.push({ c, h })
}

console.log(`${buildModel.provider}/${buildModel.model} · ${buildModel.dims} chiều`)
console.log(`   giữ ${index.chunks.length - todo.length} vector cũ · nhúng mới ${todo.length} chunk`)

for (let i = 0; i < todo.length; i += BATCH) {
  const batch = todo.slice(i, i + BATCH)
  const embs = await embedTexts(batch.map(({ c }) => embedText(c)), buildModel, { task: 'document' })
  batch.forEach(({ c, h }, j) => {
    vectors[c.id] = { hash: h, v: embs[j].map((x) => Math.round(x * 1e5) / 1e5) }
  })
  console.log(`   ${Math.min(i + BATCH, todo.length)}/${todo.length}`)
}

writeFileSync(
  OUT_PATH,
  JSON.stringify({ ...buildModel, builtAt: new Date().toISOString(), vectors }),
  'utf8',
)
console.log(`✅ ${Object.keys(vectors).length} vector → ${OUT_PATH}`)
