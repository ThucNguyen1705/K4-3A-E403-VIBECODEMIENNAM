// ============================================================
// Đo recall của tầng truy xuất cho router — không gọi LLM.
//
//   node --env-file=.env src/scripts/rag-recall.mjs [k]
//
// Router chỉ chọn được mã có trong danh sách ứng viên. Chunk đáp án rơi khỏi
// top-k là router CHẮC CHẮN sai, nên recall@k phải là 100%.
// Nhãn: mã chunk trả lời được câu hỏi (khớp tiền tố, vd "D04#p3#" = cả phần).
// ============================================================

import { readFileSync } from 'node:fs'
import { chunkById, retrieve } from '../services/retrieval.service.js'

const K = Number(process.argv[2] ?? process.env.RAG_CANDIDATES ?? 10)

const LABELS = {
  CASE_06: ['D01#p2#s4'], CASE_07: ['D01#p5#s4'], CASE_08: ['D01#p6#s2'], CASE_09: ['D01#p7#s4'],
  CASE_10: ['D02#p2#s2'], CASE_16: ['D01#p2#s5'], CASE_17: ['D01#p5#s3'], CASE_18: ['D03#p1#s2', 'D03#p5#s7'],
  CASE_19: ['D04#p1#s4'], CASE_20: ['D01#p6#s7'], CASE_24: ['D03#p5#'], CASE_25: ['D01#p5#s3', 'D01#p5#s4'],
  CASE_26: ['D02#p4#'], CASE_27: ['D04#p3#'], CASE_28: ['D03#p3#'], CASE_47: ['D03#p5#s4'],
  CASE_48: ['D04#p3#s3'], CASE_49: ['D02#p2#s2'], CASE_50: ['D01#p7#s4'], CASE_51: ['D03#p5#s7', 'D04#p4#s5'],
  CASE_52: ['D03#p4#s6'], CASE_53: ['D01#p7#s4'], CASE_54: ['D02#p6#s4'], CASE_55: ['D02#p2#s4'],
  CASE_56: ['D04#p2#s3'], CASE_57: ['D01#p5#s5'], CASE_58: ['D01#p7#s2'],
}

// Câu tự viết: diễn đạt khác chữ trong bài, không bôi đen, hỏi chéo bài
const EXTRA = [
  { id: 'X01', day: 'D02', q: 'vector database hoạt động thế nào', gold: ['D03#p5#'] },
  { id: 'X02', day: 'D02', q: 'chunking nằm ở bài nào', gold: ['D04#p3#'] },
  { id: 'X03', day: 'D01', q: 'token là gì', gold: ['D01#p2#s3'] },
  { id: 'X04', day: 'D03', q: 'làm sao chọn kích thước chunk', gold: ['D04#p3#s3'] },
  { id: 'X05', day: 'D04', q: 'temperature là gì', gold: ['D01#p5#s3'] },
  { id: 'X06', day: 'D04', q: 'làm sao để model không bịa khi không có tài liệu', gold: ['D04#p5#'] },
  { id: 'X07', day: 'D01', q: 'bắt model trả về đúng định dạng json', gold: ['D02#p6#'] },
  { id: 'X08', day: 'D03', q: 'vì sao câu tiếng Việt tốn tiền hơn tiếng Anh', gold: ['D01#p2#s3', 'D01#p6#'] },
  { id: 'X09', day: 'D01', q: 'đo độ giống nhau giữa hai câu bằng cách nào', gold: ['D03#p3#'] },
  { id: 'X10', day: 'D02', q: 'xếp hạng lại kết quả tìm kiếm', gold: ['D04#p4#s7'] },
]

const gold = JSON.parse(readFileSync(new URL('../../../../eval/golden_set.json', import.meta.url), 'utf8'))
const cases = [
  ...gold
    .filter((c) => LABELS[c.id])
    .map((c) => ({ id: c.id, day: c.day_code ?? c.lesson, q: c.student_question, ctx: c.selected_text, gold: LABELS[c.id] })),
  ...EXTRA,
]

const match = (id, g) => g.some((p) => (p.endsWith('#') ? id.startsWith(p) : id === p))

let hit = 0
let rrSum = 0
const misses = []
const modes = {}
for (const c of cases) {
  const { hits, mode } = await retrieve(c.q, { context: c.ctx ?? null, dayCode: c.day, k: K })
  modes[mode] = (modes[mode] ?? 0) + 1
  const rank = hits.findIndex((h) => match(h.chunk.id, c.gold)) + 1
  if (rank) { hit++; rrSum += 1 / rank } else misses.push(c)
  console.log(`${rank ? 'OK  ' : 'MISS'} ${c.id.padEnd(8)} [${c.day}] hạng ${rank || '-'}`.padEnd(30) + c.q.slice(0, 70))
}

console.log(`\n${Object.entries(modes).map(([m, n]) => `${m}×${n}`).join(' ')} · recall@${K} = ${hit}/${cases.length} · MRR = ${(rrSum / cases.length).toFixed(3)}`)
for (const c of misses) console.log(`  thiếu ${c.id}: cần ${c.gold.join(' | ')} (${c.gold.map((g) => chunkById(g)?.headingPath ?? g).join(' | ')})`)
process.exitCode = misses.length ? 1 : 0
