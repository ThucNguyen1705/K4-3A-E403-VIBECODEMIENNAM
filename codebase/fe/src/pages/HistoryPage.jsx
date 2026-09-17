import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  BookOpen,
  Bot,
  ChevronDown,
  Clock,
  Cpu,
  Gauge,
  Loader2,
  MessageSquareText,
  MessagesSquare,
  Paperclip,
  PlayCircle,
  Search,
  Trash2,
  User,
} from 'lucide-react'
import clsx from 'clsx'
import Navbar from '../components/Navbar'
import {
  deleteConversation,
  getChatStats,
  getConversationMessages,
  getConversations,
  getMyCourses,
} from '../services/api'
import { formatDateTime, formatMs, formatRelative, moveInfo } from '../components/chat/moves'

// Màu thanh phân bố nước đi
const MOVE_DOT = {
  give_direct_answer: 'bg-emerald-500',
  cross_lesson_redirect: 'bg-amber-500',
  no_source: 'bg-rose-500',
  locate_content: 'bg-sky-500',
  refuse_out_of_bounds: 'bg-slate-400',
  ask_clarification: 'bg-violet-500',
  clarify_domain_edge: 'bg-orange-500',
  adapt_to_correction: 'bg-teal-500',
}

function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function MoveBadge({ move }) {
  const info = moveInfo(move)
  return (
    <span className={clsx('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', info.cls)}>
      {info.text}
    </span>
  )
}

// ---------- Thẻ số liệu ----------

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Icon size={15} className="text-brand-600" /> {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

function MoveDistribution({ moves }) {
  const total = moves.reduce((s, m) => s + m.count, 0)
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Gauge size={15} className="text-brand-600" /> Cách trợ giảng phản hồi
      </div>
      {total === 0 ? (
        <p className="mt-3 text-sm text-slate-400">Chưa có dữ liệu</p>
      ) : (
        <>
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
            {moves.map((m) => (
              <div
                key={m.move}
                className={MOVE_DOT[m.move] ?? 'bg-slate-300'}
                style={{ width: `${(m.count / total) * 100}%` }}
                title={`${moveInfo(m.move).text}: ${m.count}`}
              />
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
            {moves.map((m) => (
              <span key={m.move} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <span className={clsx('h-2 w-2 rounded-full', MOVE_DOT[m.move] ?? 'bg-slate-300')} />
                {moveInfo(m.move).text} <span className="text-slate-400">{Math.round((m.count / total) * 100)}%</span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ---------- Chi tiết một lượt trả lời ----------

function IdList({ label, ids, tone }) {
  if (!ids?.length) return null
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-1">
        {ids.map((id) => (
          <code
            key={id}
            className={clsx(
              'rounded px-1.5 py-0.5 font-mono text-[11px]',
              tone === 'danger' ? 'bg-rose-50 text-rose-700' : tone === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600',
            )}
          >
            {id}
          </code>
        ))}
      </div>
    </div>
  )
}

function TraceDetails({ message }) {
  const [open, setOpen] = useState(false)
  const t = message.trace
  if (!t) return null

  return (
    <div className="mt-3 border-t border-slate-100 pt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-700"
      >
        <ChevronDown size={14} className={clsx('transition', !open && '-rotate-90')} />
        Chi tiết xử lý
      </button>

      {open && (
        <div className="mt-2 grid gap-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <span>
              Độ tự tin của router:{' '}
              <strong className="text-slate-800">{t.confidence == null ? '—' : `${Math.round(t.confidence * 100)}%`}</strong>
            </span>
            {t.moveBefore && t.moveBefore !== t.move && (
              <span className="flex items-center gap-1">
                Nước đi ban đầu <MoveBadge move={t.moveBefore} /> → sau kiểm tra <MoveBadge move={t.move} />
              </span>
            )}
            {t.crossLesson && <span className="text-amber-700">Dùng tài liệu của bài khác</span>}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {Object.entries(t.latencyMs ?? {}).map(([step, ms]) => (
              <span key={step}>
                {step === 'route' ? 'Chọn nước đi' : step === 'generate' ? 'Viết câu trả lời' : step}:{' '}
                <strong className="text-slate-800">{formatMs(ms)}</strong>
              </span>
            ))}
          </div>

          <IdList label="Đoạn tài liệu đã truy xuất" ids={t.retrievedIds} />
          <IdList label="Đoạn thực sự được trích dẫn" ids={t.citedIds} tone="ok" />
          {t.invalidIds?.length > 0 && (
            <div className="flex gap-2 rounded-md bg-rose-50 p-2 text-rose-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <IdList label="Mã trích dẫn không hợp lệ (model bịa, đã bị chặn)" ids={t.invalidIds} tone="danger" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MessageItem({ message }) {
  const navigate = useNavigate()

  if (message.role === 'user') {
    return (
      <div className="flex gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
          <User size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-700">Học viên</span> {formatDateTime(message.createdAt)}
          </div>
          {message.context && (
            <div className="mt-1.5 flex gap-2 rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-2 text-xs text-brand-900 italic">
              <Paperclip size={13} className="mt-0.5 shrink-0 text-brand-500" />
              <span className="line-clamp-4">“{message.context}”</span>
            </div>
          )}
          <p className="mt-1.5 text-sm whitespace-pre-line text-slate-800">{message.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-brand-700">
        <Bot size={16} />
      </div>
      <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-700">Trợ giảng AI</span>
          {formatDateTime(message.createdAt)}
          {message.move && <MoveBadge move={message.move} />}
          {message.model && (
            <span className="flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
              <Cpu size={11} /> {message.model}
            </span>
          )}
          {message.latencyMs != null && (
            <span className="flex items-center gap-1 text-[11px]">
              <Clock size={11} /> {formatMs(message.latencyMs)}
            </span>
          )}
        </div>

        <p className="mt-2 text-sm leading-6 whitespace-pre-line text-slate-700">{message.content}</p>

        {message.citations?.length > 0 && (
          <div className="mt-3 flex flex-col gap-1">
            <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">Nguồn trong tài liệu</p>
            {message.citations.map((c) => (
              <button
                key={c.id}
                onClick={() => c.link && navigate(c.link)}
                className="flex cursor-pointer items-start gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-left text-xs text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
              >
                <BookOpen size={13} className="mt-0.5 shrink-0 text-brand-500" />
                <span className="line-clamp-2">{c.label}</span>
              </button>
            ))}
          </div>
        )}

        <TraceDetails message={message} />
      </div>
    </div>
  )
}

// ---------- Trang ----------

export default function HistoryPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('c')

  const [courses, setCourses] = useState([])
  const [dayFilter, setDayFilter] = useState('') // "courseId:dayCode" hoặc ""
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search)

  const [stats, setStats] = useState(null)
  const [conversations, setConversations] = useState(null)
  const [listError, setListError] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [courseId, dayId] = dayFilter ? dayFilter.split(':') : [undefined, undefined]

  const lessonLabel = useMemo(() => {
    const map = {}
    for (const c of courses) for (const l of c.lessons) map[`${c.id}:${l.dayCode}`] = `${l.dayCode} · ${l.topic}`
    return map
  }, [courses])

  useEffect(() => {
    getMyCourses().then(setCourses).catch(() => setCourses([]))
  }, [])

  // Danh sách hội thoại + số liệu, tải lại khi đổi bộ lọc
  useEffect(() => {
    let cancelled = false
    setListError('')
    setConversations(null)
    Promise.all([
      getConversations({ courseId, dayId, q: debouncedSearch || undefined, limit: 100 }),
      getChatStats({ courseId, dayId }),
    ])
      .then(([list, s]) => {
        if (cancelled) return
        setConversations(list)
        setStats(s)
      })
      .catch((err) => !cancelled && (setListError(err.message), setConversations([])))
    return () => {
      cancelled = true
    }
  }, [courseId, dayId, debouncedSearch, reloadKey])

  // Chi tiết hội thoại đang chọn
  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    let cancelled = false
    setDetailLoading(true)
    setDetailError('')
    getConversationMessages(selectedId)
      .then((d) => !cancelled && setDetail(d))
      .catch((err) => !cancelled && (setDetailError(err.message), setDetail(null)))
      .finally(() => !cancelled && setDetailLoading(false))
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const select = (id) => setSearchParams(id ? { c: id } : {}, { replace: true })

  const handleDelete = async () => {
    if (!detail || !window.confirm('Xoá hội thoại này và toàn bộ log hỏi đáp bên trong?')) return
    try {
      await deleteConversation(detail.conversation.id)
      select(null)
      setReloadKey((k) => k + 1)
    } catch (err) {
      window.alert(`Không xoá được: ${err.message}`)
    }
  }

  const conv = detail?.conversation

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <Navbar />

      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-6 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <MessagesSquare className="text-brand-600" /> Lịch sử hỏi đáp
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Toàn bộ câu hỏi bạn đã gửi và phản hồi của Trợ giảng AI, kèm chi tiết cách trợ giảng xử lý.
            </p>
          </div>
        </div>

        {/* Số liệu */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_2fr]">
          <StatCard icon={MessagesSquare} label="Hội thoại" value={stats?.conversations ?? '—'} />
          <StatCard
            icon={MessageSquareText}
            label="Câu hỏi đã gửi"
            value={stats?.questions ?? '—'}
            hint={stats ? `${stats.answers} phản hồi` : undefined}
          />
          <StatCard icon={Clock} label="Thời gian phản hồi TB" value={formatMs(stats?.avgLatencyMs)} />
          <MoveDistribution moves={stats?.moves ?? []} />
        </div>

        {/* Bộ lọc */}
        <div className="mt-5 flex flex-wrap gap-3">
          <label className="flex min-w-64 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm trong câu hỏi và câu trả lời..."
              className="h-10 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="h-10 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-400"
          >
            <option value="">Tất cả bài học</option>
            {courses.map((c) => (
              <optgroup key={c.id} label={c.title}>
                {c.lessons.map((l) => (
                  <option key={l.id} value={`${c.id}:${l.dayCode}`}>
                    {l.dayCode} · {l.topic}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Danh sách + chi tiết */}
        <div className="mt-4 grid min-h-[480px] flex-1 gap-4 lg:grid-cols-[360px_1fr]">
          <section className="thin-scroll flex max-h-[calc(100vh-330px)] min-h-[300px] flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white">
            {conversations === null && (
              <div className="grid flex-1 place-items-center py-10 text-brand-600">
                <Loader2 className="animate-spin" />
              </div>
            )}
            {listError && <p className="p-4 text-sm text-red-600">{listError}</p>}
            {conversations?.length === 0 && !listError && (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-slate-500">
                <MessagesSquare className="text-slate-300" size={32} />
                {debouncedSearch || dayFilter
                  ? 'Không có hội thoại nào khớp bộ lọc.'
                  : 'Bạn chưa hỏi Trợ giảng AI câu nào. Mở một bài học và bấm “Đặt câu hỏi với AI”.'}
              </div>
            )}
            {conversations?.map((c) => (
              <button
                key={c.id}
                onClick={() => select(c.id)}
                className={clsx(
                  'w-full cursor-pointer border-b border-l-[3px] border-b-slate-100 px-4 py-3 text-left transition',
                  c.id === selectedId ? 'border-l-brand-600 bg-brand-50/70' : 'border-l-transparent hover:bg-slate-50',
                )}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span className="truncate font-medium text-brand-700">
                    {lessonLabel[`${c.courseId}:${c.dayId}`] ?? c.dayId ?? 'Không rõ bài'}
                  </span>
                  <span className="shrink-0">{formatRelative(c.lastMessageAt ?? c.updatedAt)}</span>
                </div>
                <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-800">{c.title}</p>
                {c.lastAnswer && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{c.lastAnswer}</p>}
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                  {c.lastMove && <MoveBadge move={c.lastMove} />}
                  <span>{c.messageCount} tin nhắn</span>
                </div>
              </button>
            ))}
          </section>

          <section className="thin-scroll flex max-h-[calc(100vh-330px)] min-h-[300px] flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white">
            {!selectedId && (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-slate-500">
                <MessageSquareText className="text-slate-300" size={36} />
                Chọn một hội thoại bên trái để xem toàn bộ log hỏi đáp.
              </div>
            )}
            {selectedId && detailLoading && (
              <div className="grid flex-1 place-items-center text-brand-600">
                <Loader2 className="animate-spin" />
              </div>
            )}
            {selectedId && detailError && <p className="p-4 text-sm text-red-600">{detailError}</p>}

            {conv && !detailLoading && (
              <>
                <div className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-brand-700">
                      {lessonLabel[`${conv.courseId}:${conv.dayId}`] ?? conv.dayId}
                    </p>
                    <h2 className="mt-0.5 line-clamp-2 font-semibold text-slate-900">{conv.title}</h2>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Bắt đầu {formatDateTime(conv.createdAt)} · {detail.messages.length} tin nhắn
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {conv.courseId && conv.dayId && (
                      <button
                        onClick={() => navigate(`/course/${conv.courseId}/day/${conv.dayId}?conversation=${conv.id}`)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                      >
                        <PlayCircle size={15} /> Tiếp tục hỏi trong bài
                      </button>
                    )}
                    <button
                      onClick={handleDelete}
                      title="Xoá hội thoại"
                      className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-5 px-5 py-5">
                  {detail.messages.map((m) => (
                    <MessageItem key={m.id} message={m} />
                  ))}
                  {detail.messages.at(-1)?.role === 'user' && (
                    <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      <AlertTriangle size={14} /> Câu hỏi cuối chưa có phản hồi (có thể do lỗi khi gọi AI).
                    </p>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
