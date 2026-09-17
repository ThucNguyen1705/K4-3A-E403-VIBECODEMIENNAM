// Nhãn cho từng "nước đi" của Trợ giảng AI — dùng chung cho khung chat và trang lịch sử
export const MOVES = {
  give_direct_answer: { text: 'Trả lời có căn cứ', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cross_lesson_redirect: { text: 'Nằm ở bài khác', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  no_source: { text: 'Không có trong tài liệu', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  locate_content: { text: 'Vị trí trong khoá', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  refuse_out_of_bounds: { text: 'Ngoài phạm vi', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  ask_clarification: { text: 'Cần làm rõ', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  clarify_domain_edge: { text: 'Ngoài 4 bài học', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  adapt_to_correction: { text: 'Điều chỉnh theo phản hồi', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
}

// Khung chat chỉ hiện nhãn khi trợ giảng KHÔNG trả lời thẳng — học viên cần biết vì sao
export const CHAT_BADGE_MOVES = new Set([
  'cross_lesson_redirect',
  'no_source',
  'locate_content',
  'refuse_out_of_bounds',
  'ask_clarification',
])

export const moveInfo = (move) =>
  MOVES[move] ?? { text: move ?? 'Không rõ', cls: 'bg-slate-100 text-slate-500 border-slate-200' }

// Chuyển tin nhắn từ API sang định dạng hiển thị của khung chat
export const toChatMessage = (m) =>
  m.role === 'user'
    ? { role: 'user', text: m.content, context: m.context }
    : { role: 'tutor', text: m.content, move: m.move, citations: m.citations ?? [], chips: [] }

const pad = (n) => String(n).padStart(2, '0')

export function formatDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function formatRelative(value) {
  if (!value) return ''
  const diff = (Date.now() - new Date(value).getTime()) / 1000
  if (diff < 60) return 'vừa xong'
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`
  return formatDateTime(value)
}

export const formatMs = (ms) => (ms == null ? '—' : ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`)
