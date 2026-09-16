// Lớp service giả lập. Khi có backend, chỉ cần thay phần thân các hàm
// bằng fetch/axios tới API thật — các component không phải sửa.
import { mockUsers, courses, buildLesson } from '../data/mockData'

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

export async function login(email, password) {
  await delay(500)
  const user = mockUsers.find((u) => u.email === email && u.password === password)
  if (!user) throw new Error('Email hoặc mật khẩu không đúng')
  const { password: _, ...safeUser } = user
  return { token: 'mock-token', user: safeUser }
}

export async function getMyCourses() {
  await delay()
  return courses
}

export async function getLesson(courseId, dayId) {
  await delay()
  const lesson = buildLesson(courseId, dayId)
  if (!lesson) throw new Error('Không tìm thấy bài học')
  return lesson
}
