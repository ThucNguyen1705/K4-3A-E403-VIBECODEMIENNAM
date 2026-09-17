import { query, withTransaction } from '../db.js'
import { HttpError } from '../utils/HttpError.js'
import { generateAnswer } from './ai.service.js'

const toMessage = (r) => ({
  id: Number(r.id),
  conversationId: r.conversation_id,
  role: r.role,
  content: r.content,
  context: r.context,
  partKey: r.part_key,
  model: r.model,
  move: r.move,
  citations: r.citations ?? [],
  latencyMs: r.latency_ms,
  createdAt: r.created_at,
})

const toConversation = (r) => ({
  id: r.id,
  courseId: r.course_id,
  dayId: r.day_id,
  partKey: r.part_key,
  title: r.title,
  messageCount: r.message_count !== undefined ? Number(r.message_count) : undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

async function getOwnedConversation(userId, conversationId, client = { query }) {
  const { rows } = await client.query(`SELECT * FROM conversations WHERE id = $1 AND user_id = $2`, [
    conversationId,
    userId,
  ])
  if (!rows[0]) throw new HttpError(404, 'Không tìm thấy cuộc hội thoại')
  return rows[0]
}

const insertMessage = (client, m) =>
  client
    .query(
      `INSERT INTO messages (conversation_id, role, content, context, part_key, model, latency_ms, move, citations)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        m.conversationId, m.role, m.content, m.context ?? null, m.partKey ?? null,
        m.model ?? null, m.latencyMs ?? null, m.move ?? null,
        m.citations ? JSON.stringify(m.citations) : null,
      ],
    )
    .then(({ rows }) => toMessage(rows[0]))

// Trace quyết định của trợ giảng — bằng chứng cho R5 và dữ liệu để đo độ bám căn cứ
const insertTrace = (messageId, conversationId, trace) =>
  query(
    `INSERT INTO agent_traces
       (message_id, conversation_id, day_code, move, move_before, confidence,
        retrieved_ids, cited_ids, invalid_ids, cross_lesson, latency_ms)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      messageId, conversationId, trace.dayCode ?? null, trace.move, trace.moveBefore ?? null,
      trace.confidence ?? null, trace.retrievedIds ?? [], trace.citedIds ?? [], trace.invalidIds ?? [],
      Boolean(trace.crossLesson), JSON.stringify(trace.latencyMs ?? {}),
    ],
  ).catch((e) => console.error('Không ghi được agent_traces:', e.message))

/**
 * Gửi câu hỏi: tạo conversation nếu chưa có, lưu câu hỏi, sinh phản hồi (mock), lưu phản hồi.
 */
export async function ask(userId, { conversationId, question, context, courseId, dayId, partKey }) {
  // 1. Lấy / tạo conversation và lưu câu hỏi của user
  const { conversation, userMessage, history } = await withTransaction(async (client) => {
    let conv
    if (conversationId) {
      conv = await getOwnedConversation(userId, conversationId, client)
    } else {
      const { rows } = await client.query(
        `INSERT INTO conversations (user_id, course_id, day_id, part_key, title)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, courseId ?? null, dayId ?? null, partKey ?? null, question.slice(0, 120)],
      )
      conv = rows[0]
    }

    const { rows: prev } = await client.query(
      `SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY id DESC LIMIT 10`,
      [conv.id],
    )
    const msg = await insertMessage(client, {
      conversationId: conv.id,
      role: 'user',
      content: question,
      context,
      partKey: partKey ?? conv.part_key,
    })
    return { conversation: conv, userMessage: msg, history: prev.reverse() }
  })

  // 2. Sinh phản hồi (ngoài transaction vì có thể lâu)
  const answer = await generateAnswer({
    question,
    context,
    history,
    dayCode: dayId ?? conversation.day_id,
    courseId: courseId ?? conversation.course_id,
  })

  // 3. Lưu phản hồi của AI
  const aiMessage = await insertMessage({ query }, {
    conversationId: conversation.id,
    role: 'assistant',
    content: answer.content,
    partKey: userMessage.partKey,
    model: answer.model,
    move: answer.move,
    citations: answer.citations,
    latencyMs: answer.latencyMs,
  })
  await query(`UPDATE conversations SET updated_at = now() WHERE id = $1`, [conversation.id])
  if (answer.trace) await insertTrace(aiMessage.id, conversation.id, answer.trace)

  return { conversationId: conversation.id, userMessage, aiMessage, chips: answer.chips ?? [] }
}

export async function listConversations(userId, { courseId, dayId, limit }) {
  const { rows } = await query(
    `SELECT c.*, COUNT(m.id) AS message_count
       FROM conversations c
       LEFT JOIN messages m ON m.conversation_id = c.id
      WHERE c.user_id = $1
        AND ($2::text IS NULL OR c.course_id = $2)
        AND ($3::text IS NULL OR c.day_id = $3)
      GROUP BY c.id
      ORDER BY c.updated_at DESC
      LIMIT $4`,
    [userId, courseId ?? null, dayId ?? null, limit],
  )
  return rows.map(toConversation)
}

export async function getConversationMessages(userId, conversationId) {
  const conv = await getOwnedConversation(userId, conversationId)
  const { rows } = await query(`SELECT * FROM messages WHERE conversation_id = $1 ORDER BY id`, [conversationId])
  return { conversation: toConversation(conv), messages: rows.map(toMessage) }
}

export async function deleteConversation(userId, conversationId) {
  await getOwnedConversation(userId, conversationId)
  await query(`DELETE FROM conversations WHERE id = $1`, [conversationId])
}
