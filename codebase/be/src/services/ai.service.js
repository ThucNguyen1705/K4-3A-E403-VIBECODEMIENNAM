// ============================================================
// MOCK AI — thay phần thân generateAnswer bằng lời gọi LLM thật sau này.
// Chữ ký hàm giữ nguyên để chat.service không phải sửa.
// ============================================================

const MOCK_MODEL = 'mock-tutor-v0'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * @param {{ question: string, context?: string|null, history?: {role: string, content: string}[] }} input
 * @returns {Promise<{ content: string, model: string, latencyMs: number }>}
 */
export async function generateAnswer({ question, context }) {
  const start = Date.now()
  await sleep(300 + Math.random() * 500)

  const quote = context ? `“${context.length > 120 ? `${context.slice(0, 120)}…` : context}”` : null
  const content = [
    '🤖 [Phản hồi mô phỏng]',
    quote ? `Bạn đang hỏi về đoạn: ${quote}` : null,
    `Câu hỏi: "${question}"`,
    'Trợ giảng AI thật sẽ được tích hợp sau. Câu hỏi và phản hồi này đã được lưu vào log.',
  ]
    .filter(Boolean)
    .join('\n\n')

  return { content, model: MOCK_MODEL, latencyMs: Date.now() - start }
}
