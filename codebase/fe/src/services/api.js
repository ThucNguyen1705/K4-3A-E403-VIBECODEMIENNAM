// Client gọi backend Express
const API_URL = import.meta.env.VITE_API_URL ?? '/api'
export const TOKEN_KEY = 'vlearn_token'

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem(TOKEN_KEY)
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: body && JSON.stringify(body) })
  } catch {
    throw new ApiError(0, 'Không kết nối được tới máy chủ')
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data.error?.message ?? 'Có lỗi xảy ra', data.error?.details)
  return data
}

// ---------- Auth ----------
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: { email, password }, auth: false })

export const register = (name, email, password) =>
  request('/auth/register', { method: 'POST', body: { name, email, password }, auth: false })

export const getMe = () => request('/auth/me')

// ---------- Trợ giảng AI (câu hỏi + phản hồi được log ở backend) ----------
export const askTutor = ({ conversationId, question, context, courseId, dayId, partKey }) =>
  request('/chat/ask', { method: 'POST', body: { conversationId, question, context, courseId, dayId, partKey } })

const queryString = (params) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString()
  return qs ? `?${qs}` : ''
}

export const getConversations = ({ courseId, dayId, q, limit } = {}) =>
  request(`/chat/conversations${queryString({ courseId, dayId, q, limit })}`).then((d) => d.conversations)

export const getConversationMessages = (id) => request(`/chat/conversations/${id}/messages`)

export const deleteConversation = (id) => request(`/chat/conversations/${id}`, { method: 'DELETE' })

export const getChatStats = ({ courseId, dayId } = {}) => request(`/chat/stats${queryString({ courseId, dayId })}`)

// ---------- Khoá học & ngày học ----------
export const getMyCourses = () => request('/courses').then((d) => d.courses)

export const getLessons = (courseId) =>
  request(`/courses/${encodeURIComponent(courseId)}/lessons`).then((d) => d.lessons)

export const getLesson = (courseId, dayCode) =>
  request(`/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(dayCode)}`).then((d) => d.lesson)
