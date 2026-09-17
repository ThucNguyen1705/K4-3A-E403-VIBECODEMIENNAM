// Chạy golden set qua CHÍNH agent của sản phẩm (ai.service.js), không gọi thẳng model.
// run_eval.js cũ gọi thẳng Gemini bằng prompt riêng nên số đo ra được không phải
// số của sản phẩm — giám khảo hỏi "cái đo có phải cái demo không" là đuối.
//
//   node --env-file=codebase/be/.env eval/scripts/run_agent_eval.mjs
//   AI_PROVIDER=openai node --env-file=codebase/be/.env eval/scripts/run_agent_eval.mjs
//   GAP=15000 ... (giãn cách giữa các case, dùng khi provider bị rate limit)

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = new URL('../../', import.meta.url)
const GOLDEN = fileURLToPath(new URL('eval/golden_set.json', ROOT))
const OUT = fileURLToPath(new URL('eval/run_results.md', ROOT))

const { generateAnswer } = await import(new URL('codebase/be/src/services/ai.service.js', ROOT).href)

const GAP = Number(process.env.GAP ?? 0)
const cases = JSON.parse(readFileSync(GOLDEN, 'utf8'))

// Golden set có hai thế hệ case: bản cũ ghi bài ở trường `lesson`, bản mới dùng `day_code`.
const dayOf = (c) => c.day_code ?? c.lesson ?? 'D01'

const results = []
console.log(`Chạy ${cases.length} case qua agent (${process.env.AI_PROVIDER ?? 'gemini'})\n`)

for (const [i, c] of cases.entries()) {
  const started = Date.now()
  let r = null
  let err = null
  try {
    r = await generateAnswer({
      question: c.student_question,
      context: c.selected_text ?? null,
      dayCode: dayOf(c),
      courseId: 'k4p1',
    })
  } catch (e) {
    err = e.message
  }

  const move = r?.move ?? 'ERROR'
  const movePass = move === c.expected_move
  const invalid = r?.trace?.invalidIds ?? []
  const cited = r?.trace?.citedIds ?? []

  // Hai chiều chấm được bằng máy. Chiều thứ ba (câu chữ đúng cỡ) chấm tay.
  const needsCitation = ['give_direct_answer', 'cross_lesson_redirect'].includes(c.expected_move)
  const citationPass = invalid.length === 0 && (!needsCitation || cited.length > 0)

  results.push({
    id: c.id,
    category: c.category,
    day: dayOf(c),
    question: c.student_question,
    expected: c.expected_move,
    actual: move,
    movePass,
    citationPass,
    cited,
    invalid,
    latency: Date.now() - started,
    answer: (r?.content ?? err ?? '').replace(/\s+/g, ' ').slice(0, 200),
    err,
  })

  console.log(
    `${movePass ? 'PASS' : 'FAIL'} ${citationPass ? '   ' : 'CIT'} ${c.id}  ${c.expected_move.padEnd(22)}→ ${move.padEnd(22)} ${String(Date.now() - started).padStart(6)}ms`,
  )
  if (!movePass && !err) console.log(`        "${c.student_question}"`)
  if (invalid.length) console.log(`        MÃ BỊA: ${invalid.join(' ')}`)
  if (err) console.log(`        LỖI: ${err.slice(0, 120)}`)

  if (GAP && i < cases.length - 1) await new Promise((res) => setTimeout(res, GAP))
}

// ---------- Bảng kết quả ----------

const n = results.length
const movePass = results.filter((r) => r.movePass).length
const citPass = results.filter((r) => r.citationPass).length
const fabricated = results.filter((r) => r.invalid.length).length
const pct = (k) => `${Math.round((100 * k) / n)}%`

const byCat = {}
for (const r of results) {
  byCat[r.category] ??= { n: 0, pass: 0 }
  byCat[r.category].n++
  if (r.movePass) byCat[r.category].pass++
}

const lines = []
lines.push('# Kết quả chạy golden set qua agent\n')
lines.push(`*Sinh bởi run_agent_eval.mjs. Provider: **${process.env.AI_PROVIDER ?? 'gemini'}**. Chạy lúc ${new Date().toISOString()}.*\n`)
lines.push('## Tổng\n')
lines.push('| Chiều chất lượng | Đạt | Tỉ lệ |')
lines.push('|---|---:|---:|')
lines.push(`| Chọn đúng nước đi | ${movePass}/${n} | **${pct(movePass)}** |`)
lines.push(`| Trích dẫn hợp lệ | ${citPass}/${n} | **${pct(citPass)}** |`)
lines.push(`| Lượt có mã trích dẫn bịa | ${fabricated}/${n} | ${pct(fabricated)} |`)
lines.push('')
lines.push(`**Quality bar đã chốt:** đạt khi ≥70% chọn đúng nước đi, và 100% case lớp ① không nói chắc khi không có căn cứ.`)
lines.push('')
lines.push('## Theo nhóm case\n')
lines.push('| Nhóm | Đạt | Tỉ lệ |')
lines.push('|---|---:|---:|')
for (const [cat, v] of Object.entries(byCat).sort()) {
  lines.push(`| ${cat} | ${v.pass}/${v.n} | ${Math.round((100 * v.pass) / v.n)}% |`)
}
lines.push('')
lines.push('## Từng case\n')
lines.push('| # | Câu hỏi | Bài | Mong đợi | Thực tế | Nước đi | Trích dẫn | ms |')
lines.push('|---|---|---|---|---|:-:|:-:|---:|')
for (const r of results) {
  const q = r.question.replace(/\|/g, '\\|').slice(0, 46)
  lines.push(
    `| ${r.id} | ${q} | ${r.day} | \`${r.expected}\` | \`${r.actual}\` | ${r.movePass ? '✅' : '❌'} | ${r.citationPass ? '✅' : '❌'} | ${r.latency} |`,
  )
}
lines.push('')
const fails = results.filter((r) => !r.movePass)
if (fails.length) {
  lines.push('## Case chưa đạt — phân tích\n')
  for (const r of fails) {
    lines.push(`**${r.id}** · \`${r.expected}\` → \`${r.actual}\``)
    lines.push(`- Câu hỏi: *"${r.question}"* (đang mở ${r.day})`)
    lines.push(`- Trợ giảng trả: ${r.answer}`)
    if (r.invalid.length) lines.push(`- Mã bịa: ${r.invalid.join(', ')}`)
    lines.push('')
  }
}

writeFileSync(OUT, lines.join('\n'), 'utf8')

console.log(`\n${'='.repeat(60)}`)
console.log(`Nước đi đúng : ${movePass}/${n} (${pct(movePass)})`)
console.log(`Trích dẫn OK : ${citPass}/${n} (${pct(citPass)})`)
console.log(`Có mã bịa    : ${fabricated}/${n}`)
console.log(`→ ${OUT}`)
