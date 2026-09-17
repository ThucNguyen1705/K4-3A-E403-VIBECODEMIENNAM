import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Hand, Loader2, Menu, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { getLesson } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../hooks/useProgress'
import UserMenu from '../components/UserMenu'
import LessonSidebar from '../components/lesson/LessonSidebar'
import ContentRenderer from '../components/lesson/ContentRenderer'
import TutorPanel from '../components/lesson/TutorPanel'
import SelectionAskButton from '../components/lesson/SelectionAskButton'

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
    getLesson(courseId, dayId).then(setLesson).catch((e) => setError(e.message))
  }, [courseId, dayId])

  const parts = lesson?.parts ?? []
  // ?part=<uuid> khi bấm trong sidebar; ?partPos=<số thứ tự> khi bấm trích dẫn của Trợ giảng
  const partPos = Number(searchParams.get('partPos'))
  const index = Math.max(
    0,
    partPos > 0 ? partPos - 1 : parts.findIndex((p) => p.id === searchParams.get('part')),
  )
  const current = parts[index]

  // Cuộn lên đầu khi đổi phần nội dung
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [current?.id])

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

  const select = (partId) => setSearchParams({ part: partId }, { replace: true })
  const doneCount = parts.filter((p) => done.includes(p.id)).length
  const percent = parts.length ? Math.round((doneCount / parts.length) * 100) : 0
  const isDone = current && done.includes(current.id)

  return (
    <div className="flex h-full flex-col bg-white">
      {/* HEADER — 52px như prototype */}
      <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex min-w-0 items-center gap-3">
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
          <span className="truncate font-semibold text-slate-900">
            Bài {lesson.position} · {lesson.title}
          </span>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden items-center gap-3 md:flex">
            <span className="text-sm text-slate-500">
              {doneCount}/{parts.length} phần
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
            selectedId={current?.id}
            onSelect={select}
            doneIds={done}
            onClose={() => setShowSidebar(false)}
          />
        )}

        <main ref={contentRef} className="thin-scroll flex-1 overflow-y-auto bg-white px-12 pt-7 pb-16">
          <div className="mx-auto max-w-[820px]">
            {!current ? (
              <p className="mt-10 text-center text-slate-500">Ngày học này chưa có nội dung.</p>
            ) : (
              <>
                <p className="mb-2 text-xs font-semibold tracking-wide text-brand-600 uppercase">
                  {lesson.topic} · Phần {current.position}/{parts.length}
                </p>
                <h1 className="text-3xl font-bold text-slate-900">{current.title}</h1>

                <ContentRenderer content={current.content} />

                {/* Footer điều hướng */}
                <div className="mt-12 flex items-center justify-between gap-3 border-t border-slate-200 pt-6">
                  <button
                    disabled={index === 0}
                    onClick={() => select(parts[index - 1].id)}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} /> Phần trước
                  </button>

                  <button
                    onClick={() => toggle(current.id)}
                    className={clsx(
                      'flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition',
                      isDone
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'border border-brand-200 text-brand-700 hover:bg-brand-50',
                    )}
                  >
                    <CheckCircle2 size={16} />
                    {isDone ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                  </button>

                  <button
                    disabled={index === parts.length - 1}
                    onClick={() => {
                      if (!isDone) toggle(current.id)
                      select(parts[index + 1].id)
                    }}
                    className="flex cursor-pointer items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Phần tiếp theo <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
        <SelectionAskButton containerRef={contentRef} onAsk={askAboutSelection} />

        {showTutor && (
          <TutorPanel
            lessonTitle={current?.title ?? lesson.title}
            userName={user?.shortName}
            courseId={courseId}
            dayId={dayId}
            partKey={current?.id}
            context={askContext}
            onClearContext={() => setAskContext('')}
            onClose={() => setShowTutor(false)}
          />
        )}
      </div>
    </div>
  )
}
