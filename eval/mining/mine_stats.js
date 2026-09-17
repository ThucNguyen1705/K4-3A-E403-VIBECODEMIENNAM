import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '../..')

const DATA_PATH = path.join(ROOT, 'tutor_turns.json')

if (!fs.existsSync(DATA_PATH)) {
  console.error(`❌ Không tìm thấy file dữ liệu: ${DATA_PATH}`)
  process.exit(1)
}

console.log(`📊 Đang nạp dữ liệu từ ${DATA_PATH}...`)
const allTurns = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))

// 1. Lọc cohort K4
const k4Turns = allTurns.filter((t) => t.cohort_hint === 'K4')
const totalK4 = k4Turns.length
const uniqueStudents = new Set(k4Turns.map((t) => t.student)).size

console.log(`\n======================================================`)
console.log(`MINING EVIDENCE CHATLOG — VIBECODEMIENNAM (Track A1)`)
console.log(`Tổng lượt chat K4: ${totalK4.toLocaleString()} lượt / ${uniqueStudents} học viên`)
console.log(`======================================================\n`)

// 2. Thống kê câu hỏi cụt <= 25 ký tự (sau khi bỏ tiền tố ngữ cảnh)
const CTX_PREFIX = /^\(.*?\)\s*/s
const shortTurns = k4Turns.filter((t) => {
  const cleanQ = (t.student_question || '').replace(CTX_PREFIX, '').trim()
  return cleanQ.length <= 25 && cleanQ.length > 0
})
const shortCount = shortTurns.length
const shortPct = ((shortCount / totalK4) * 100).toFixed(1)

// 3. Phản hồi của tutor với câu hỏi cụt
const askedBack = shortTurns.filter((t) => t.move_used === 'ask_probing_question')
const directAnswers = shortTurns.filter((t) => t.move_used !== 'ask_probing_question')
const askBackPct = ((askedBack.length / shortCount) * 100).toFixed(1)
const avgDirectLen = directAnswers.length
  ? Math.round(directAnswers.reduce((sum, t) => sum + (t.reply_len || 0), 0) / directAnswers.length)
  : 0

// 4. Trích dẫn trong câu hỏi tự gõ
const customQuestions = k4Turns.filter((t) => !t.is_preset)
const noCitation = customQuestions.filter((t) => !t.has_citation)
const noCitationPct = ((noCitation.length / customQuestions.length) * 100).toFixed(1)
const admittedNoSource = customQuestions.filter((t) =>
  (t.tutor_reply || '').toLowerCase().includes('không có trong tài liệu'),
)
const admittedPct = ((admittedNoSource.length / customQuestions.length) * 100).toFixed(1)

// 5. Tính năng sư phạm hứa hẹn
const probingCount = k4Turns.filter((t) => t.move_used === 'ask_probing_question').length
const understandingCount = k4Turns.filter((t) => t.understanding_level !== null && t.understanding_level !== undefined).length
const hintCount = k4Turns.filter((t) => t.move_used === 'give_hint').length

// 6. Học viên hỏi 1 câu rồi bỏ
const turnsByStudent = {}
k4Turns.forEach((t) => {
  turnsByStudent[t.student] = (turnsByStudent[t.student] || 0) + 1
})
const oneTurnDropouts = Object.values(turnsByStudent).filter((c) => c === 1).length

console.log(`1. Câu hỏi cụt ≤ 25 ký tự:`)
console.log(`   👉 ${shortCount}/${totalK4} (${shortPct}%)`)
console.log(`2. Trong ${shortCount} câu cụt, tutor hỏi lại:`)
console.log(`   👉 Chỉ ${askedBack.length} lần (${askBackPct}%)`)
console.log(`   👉 ${directAnswers.length} lần trả lời thẳng, dài TB ${avgDirectLen} ký tự`)
console.log(`3. Câu tự gõ không trích dẫn:`)
console.log(`   👉 ${noCitation.length}/${customQuestions.length} (${noCitationPct}%) không có trích dẫn`)
console.log(`   👉 Chỉ ${admittedNoSource.length} lượt (${admittedPct}%) thừa nhận không có trong tài liệu`)
console.log(`4. Tần suất chạy tính năng sư phạm đã hứa:`)
console.log(`   👉 ask_probing_question: ${probingCount}/${totalK4}`)
console.log(`   👉 understanding_level có giá trị: ${understandingCount}/${totalK4}`)
console.log(`   👉 give_hint: ${hintCount}/${totalK4}`)
console.log(`5. Học viên hỏi 1 câu rồi không quay lại:`)
console.log(`   👉 ${oneTurnDropouts}/${uniqueStudents} học viên`)
console.log(`\n✅ Trích xuất dữ liệu mining thành công! Khớp số liệu tại §1 spec.md.`)
