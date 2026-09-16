import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Hand, Loader2, Menu, Presentation, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { getLesson } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { setLastDay, useProgress } from '../hooks/useProgress'
import UserMenu from '../components/UserMenu'
import LessonSidebar from '../components/lesson/LessonSidebar'
import ContentRenderer from '../components/lesson/ContentRenderer'
import TutorPanel from '../components/lesson/TutorPanel'
import SelectionAskButton from '../components/lesson/SelectionAskButton'

// Làm phẳng slides + parts thành một danh sách tuần tự để điều hướng trước/sau
function flatten(lesson) {
  const items = lesson.slides.map((s) => ({ key: `slide:${s.id}`, kind: 'slide', data: s }))
  lesson.labs.forEach((lab) =>
    lab.groups.forEach((g) =>
      g.parts.forEach((p) => items.push({ key: `${lab.id}:${p.id}`, kind: 'part', data: p, lab, group: g })),
    ),
  )
  return items
}

export default function LessonPage() {
  const { courseId, dayId } = useParams()
  // key theo ngày để reset state khi đổi bài
  return <LessonView key={`${courseId}-${dayId}`} courseId={courseId} dayId={dayId} />
}

function LessonView({ courseId, dayId }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [lesson, setLesson] = useState(null)
  const [error, setError] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const [showTutor, setShowTutor] = useState(false)
  const [askContext, setAskContext] = useState('')
  const contentRef = useRef(null)
  const { done, toggle } = useProgress(courseId, dayId)

  const askAboutSelection = (text) => {
    setAskContext(text)
    setShowTutor(true)
  }

  useEffect(() => {
    setLastDay(courseId, dayId)
    getLesson(courseId, dayId).then(setLesson).catch((e) => setError(e.message))
  }, [courseId, dayId])

  const items = useMemo(() => (lesson ? flatten(lesson) : []), [lesson])

  const numbering = useMemo(() => {
    const map = {}
    let n = 0
    items.forEach((it) => {
      if (it.kind === 'part' && it.data.type !== 'code') map[it.key] = ++n
    })
    return map
  }, [items])

  if (error) {
    return (
      <div className="grid h-full place-items-center text-slate-600">
        <div className="text-center">
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="mt-3 cursor-pointer text-brand-600 hover:underline">
            Về trang chủ
          </button>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="grid h-full place-items-center text-brand-600">
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }

  const firstPart = items.find((it) => it.kind === 'part')?.key ?? items[0]?.key
  const selectedKey = items.some((it) => it.key === searchParams.get('part')) ? searchParams.get('part') : firstPart
  const index = items.findIndex((it) => it.key === selectedKey)
  const current = items[index]
  const select = (key) => setSearchParams({ part: key }, { replace: true })

  const doneCount = items.filter((it) => done.includes(it.key) || it.data.done).length
  const percent = Math.round((doneCount / items.length) * 100)
  const isDone = done.includes(current.key) || current.data.done

  return (
    <div className="flex h-full flex-col bg-white">
      {/* HEADER — 52px như prototype */}
      <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            title="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>
          {!showSidebar && (
            <button
              onClick={() => setShowSidebar(true)}
              className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
              title="Mở nội dung bài học"
            >
              <Menu size={18} />
            </button>
          )}
          <span className="font-semibold text-slate-900">
            Bài {lesson.day.order} · {lesson.day.title}
          </span>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden items-center gap-3 md:flex">
            <span className="text-sm text-slate-500">
              {doneCount}/{items.length} bài
            </span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <button
            onClick={() => setShowTutor((s) => !s)}
            className={clsx(
              'flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition',
              showTutor ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-brand-50 hover:text-brand-700',
            )}
          >
            <Sparkles size={16} /> Đặt câu hỏi với AI
          </button>
          <button className="hidden cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 lg:flex">
            <Hand size={16} /> Gửi yêu cầu
          </button>
          <UserMenu />
        </div>
      </header>

      {/* BODY — 3 cột: sidebar 280 · content · tutor 400 */}
      <div className="flex min-h-0 flex-1">
        {showSidebar && (
          <LessonSidebar
            lesson={lesson}
            selected={selectedKey}
            onSelect={select}
            doneKeys={done}
            numbering={numbering}
            onClose={() => setShowSidebar(false)}
          />
        )}

        <main ref={contentRef} className="thin-scroll flex-1 overflow-y-auto bg-white px-12 pt-7 pb-16">
          <div className="mx-auto max-w-[820px]">
            {current.kind === 'part' && (
              <p className="mb-2 text-xs font-semibold tracking-wide text-brand-600 uppercase">
                {current.lab.title}
                {current.group.title && ` · ${current.group.title}`}
              </p>
            )}
            <h1 className="text-3xl font-bold text-slate-900">{current.data.title}</h1>

            {current.kind === 'slide' ? (
              <div className="mt-6 grid aspect-video place-items-center rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50 to-white">
                <div className="text-center text-slate-500">
                  <Presentation size={48} className="mx-auto text-brand-400" />
                  <p className="mt-3 font-medium text-slate-700">{current.data.title}</p>
                  <p className="text-sm">Trình xem slide (mock) — sẽ nhúng file thật từ backend</p>
                </div>
              </div>
            ) : (
              <ContentRenderer blocks={current.data.blocks} />
            )}

            {/* Footer điều hướng */}
            <div className="mt-12 flex items-center justify-between gap-3 border-t border-slate-200 pt-6">
              <button
                disabled={index === 0}
                onClick={() => select(items[index - 1].key)}
                className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Bài trước
              </button>

              <button
                disabled={current.data.done}
                onClick={() => toggle(current.key)}
                className={clsx(
                  'flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-default',
                  isDone
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border border-brand-200 text-brand-700 hover:bg-brand-50',
                )}
              >
                <CheckCircle2 size={16} />
                {isDone ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
              </button>

              <button
                disabled={index === items.length - 1}
                onClick={() => {
                  if (!isDone) toggle(current.key)
                  select(items[index + 1].key)
                }}
                className="flex cursor-pointer items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Bài tiếp theo <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </main>
        <SelectionAskButton containerRef={contentRef} onAsk={askAboutSelection} />

        {showTutor && (
          <TutorPanel
            lessonTitle={current.data.title}
            userName={user?.shortName}
            context={askContext}
            onClearContext={() => setAskContext('')}
            onClose={() => setShowTutor(false)}
          />
        )}
      </div>
    </div>
  )
}
