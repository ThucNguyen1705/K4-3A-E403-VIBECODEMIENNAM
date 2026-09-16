import { useCallback, useState } from 'react'

// Tiến độ học lưu tạm ở localStorage — sau này sẽ đồng bộ với backend.
const keyOf = (courseId, dayId) => `vlearn_progress_${courseId}_${dayId}`
const LAST_DAY_KEY = 'vlearn_last_day'

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

export function useProgress(courseId, dayId) {
  const [done, setDone] = useState(() => read(keyOf(courseId, dayId), []))

  const toggle = useCallback(
    (partKey) => {
      setDone((prev) => {
        const next = prev.includes(partKey) ? prev.filter((k) => k !== partKey) : [...prev, partKey]
        localStorage.setItem(keyOf(courseId, dayId), JSON.stringify(next))
        return next
      })
    },
    [courseId, dayId],
  )

  return { done, toggle }
}

export function getLastDays() {
  return read(LAST_DAY_KEY, {})
}

export function setLastDay(courseId, dayId) {
  localStorage.setItem(LAST_DAY_KEY, JSON.stringify({ ...getLastDays(), [courseId]: dayId }))
}
