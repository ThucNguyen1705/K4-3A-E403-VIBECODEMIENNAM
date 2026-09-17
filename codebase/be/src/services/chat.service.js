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
  ...(r.trace && { trace: toTrace(r.trace) }),
})

const toTrace = (t) => ({
  move: t.move,
  moveBefore: t.move_before,
  confidence: t.confidence,
  dayCode: t.day_code,
  retrievedIds: t.retrieved_ids ?? [],
  citedIds: t.cited_ids ?? [],
  invalidIds: t.invalid_ids ?? [],
  crossLesson: t.cross_lesson,
  latencyMs: t.latency_ms ?? {},
})

const toConversation = (r) => ({
  id: r.id,
  courseId: r.course_id,
  dayId: r.day_id,
  partKey: r.part_key,
  title: r.title,
  messageCount: r.message_count !== undefined ? Number(r.message_count) : undefined,
  lastAnswer: r.last_answer ?? undefined,
  lastMove: r.last_move ?? undefined,
  lastMessageAt: r.last_message_at ?? undefined,
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

// Escape ký tự đặc biệt của LIKE để tìm kiếm theo đúng chuỗi người dùng gõ
const likePattern = (q) => (q ? `%${q.replace(/[\\%_]/g, '\\$&')}%` : null)

export async function listConversations(userId, { courseId, dayId, q, limit }) {
  const { rows } = await query(
    `SELECT c.*,
            COUNT(m.id)        AS message_count,
            MAX(m.created_at)  AS last_message_at,
            last.content       AS last_answer,
            last.move          AS last_move
       FROM conversations c
       LEFT JOIN messages m ON m.conversation_id = c.id
       LEFT JOIN LATERAL (
         SELECT content, move FROM messages
          WHERE conversation_id = c.id AND role = 'assistant'
          ORDER BY id DESC LIMIT 1
       ) last ON true
      WHERE c.user_id = $1
        AND ($2::text IS NULL OR c.course_id = $2)
        AND ($3::text IS NULL OR c.day_id = $3)
        AND ($4::text IS NULL
             OR c.title ILIKE $4
             OR EXISTS (SELECT 1 FROM messages s WHERE s.conversation_id = c.id AND s.content ILIKE $4))
      GROUP BY c.id, last.content, last.move
      ORDER BY c.updated_at DESC
      LIMIT $5`,
    [userId, courseId ?? null, dayId ?? null, likePattern(q), limit],
  )
  return rows.map(toConversation)
}

export async function getConversationMessages(userId, conversationId) {
  const conv = await getOwnedConversation(userId, conversationId)
  const { rows } = await query(
    `SELECT m.*, to_jsonb(t) AS trace
       FROM messages m
       LEFT JOIN LATERAL (
         SELECT * FROM agent_traces WHERE message_id = m.id ORDER BY id DESC LIMIT 1
       ) t ON true
      WHERE m.conversation_id = $1
      ORDER BY m.id`,
    [conversationId],
  )
  return { conversation: toConversation(conv), messages: rows.map(toMessage) }
}

// Số liệu tổng hợp lịch sử hỏi đáp của user (lọc được theo khoá / ngày)
export async function getStats(userId, { courseId, dayId }) {
  const params = [userId, courseId ?? null, dayId ?? null]
  const scope = `c.user_id = $1
    AND ($2::text IS NULL OR c.course_id = $2)
    AND ($3::text IS NULL OR c.day_id = $3)`

  const [{ rows: totals }, { rows: moves }] = await Promise.all([
    query(
      `SELECT COUNT(DISTINCT c.id)                                   AS conversations,
              COUNT(m.id) FILTER (WHERE m.role = 'user')             AS questions,
              COUNT(m.id) FILTER (WHERE m.role = 'assistant')        AS answers,
              ROUND(AVG(m.latency_ms) FILTER (WHERE m.role = 'assistant')) AS avg_latency_ms
         FROM conversations c
         LEFT JOIN messages m ON m.conversation_id = c.id
        WHERE ${scope}`,
      params,
    ),
    query(
      `SELECT COALESCE(m.move, 'unknown') AS move, COUNT(*) AS count
         FROM messages m
         JOIN conversations c ON c.id = m.conversation_id
        WHERE ${scope} AND m.role = 'assistant'
        GROUP BY 1
        ORDER BY 2 DESC`,
      params,
    ),
  ])

  const t = totals[0]
  return {
    conversations: Number(t.conversations),
    questions: Number(t.questions),
    answers: Number(t.answers),
    avgLatencyMs: t.avg_latency_ms === null ? null : Number(t.avg_latency_ms),
    moves: moves.map((r) => ({ move: r.move, count: Number(r.count) })),
  }
}

export async function deleteConversation(userId, conversationId) {
  await getOwnedConversation(userId, conversationId)
  await query(`DELETE FROM conversations WHERE id = $1`, [conversationId])
}
