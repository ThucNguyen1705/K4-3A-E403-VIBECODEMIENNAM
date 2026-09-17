import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUp, BookOpen, CornerDownRight, Loader2, Paperclip, Plus, Sparkles, X } from 'lucide-react'
import { askTutor } from '../../services/api'

const truncate = (s, n) => (s.length > n ? `${s.slice(0, n)}…` : s)

// Nhãn của từng nước đi. Học viên cần biết vì sao trợ giảng không trả lời thẳng.
const MOVE_BADGE = {
  cross_lesson_redirect: { text: 'Nằm ở bài khác', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  no_source: { text: 'Không có trong tài liệu', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  locate_content: { text: 'Vị trí trong khoá', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  refuse_out_of_bounds: { text: 'Ngoài phạm vi', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  ask_clarification: { text: 'Cần làm rõ', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
}

// Khung Trợ giảng AI — gửi câu hỏi tới backend, câu hỏi & phản hồi (mock) được log vào database.
export default function TutorPanel({ lessonTitle, userName, context, onClearContext, onClose, courseId, dayId, partKey }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState(null)
  const [sending, setSending] = useState(false)
  const inputRef = useRef(null)
  const bodyRef = useRef(null)
  const navigate = useNavigate()

  // Focus ô nhập mỗi khi có đoạn bôi đen mới được gửi sang
  useEffect(() => {
    if (context) inputRef.current?.focus()
  }, [context])

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  const send = async (override) => {
    const text = (override ?? input).trim() || (context ? 'Giải thích giúp mình đoạn này' : '')
    if (!text || sending) return
    const sentContext = context || null
    setMessages((m) => [...m, { role: 'user', text, context: sentContext }])
    setInput('')
    onClearContext()
    setSending(true)
    try {
      const res = await askTutor({ conversationId, question: text, context: sentContext, courseId, dayId, partKey })
      setConversationId(res.conversationId)
      setMessages((m) => [
        ...m,
        {
          role: 'tutor',
          text: res.aiMessage.content,
          move: res.aiMessage.move,
          citations: res.aiMessage.citations ?? [],
          chips: res.chips ?? [],
        },
      ])
    } catch (err) {
      setMessages((m) => [...m, { role: 'error', text: `Không gửi được câu hỏi: ${err.message}` }])
    } finally {
      setSending(false)
    }
  }

  const newChat = () => {
    setMessages([])
    setConversationId(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <aside className="flex w-[400px] shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-slate-200 px-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Sparkles size={16} className="text-brand-600" /> Trợ giảng AI
        </div>
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <button
              onClick={newChat}
              className="flex cursor-pointer items-center gap-1 text-xs text-slate-500 hover:text-brand-700"
            >
              <Plus size={14} /> Chat mới
            </button>
          )}
          <button onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-700" title="Đóng">
            <X size={16} />
          </button>
        </div>
      </div>

      <div ref={bodyRef} className="thin-scroll flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="m-auto px-4 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Sparkles />
            </div>
            <p className="mt-4 font-semibold text-slate-800">Hôm nay {userName} muốn hỏi gì nào?</p>
            <p className="mt-1 text-xs text-slate-500">Đang mở: {lessonTitle}</p>
            <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
              💡 Mẹo: bôi đen một đoạn trong bài học rồi bấm <strong>“Hỏi Trợ giảng AI”</strong> để hỏi đúng chỗ bạn
              chưa hiểu.
            </p>
          </div>
        ) : (
          messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="max-w-[90%] self-end rounded-2xl rounded-br-sm bg-brand-600 px-3.5 py-2.5 text-sm text-white">
                {m.context && (
                  <p className="mb-1.5 border-l-2 border-white/60 pl-2 text-xs text-brand-100 italic">
                    “{truncate(m.context, 120)}”
                  </p>
                )}
                {m.text}
              </div>
            ) : (
              <div key={i} className="flex max-w-[95%] flex-col gap-2 self-start">
                <div
                  className={
                    m.role === 'error'
                      ? 'rounded-2xl rounded-bl-sm border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700'
                      : 'rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm whitespace-pre-line text-slate-700'
                  }
                >
                  {MOVE_BADGE[m.move] && (
                    <span
                      className={`mb-2 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${MOVE_BADGE[m.move].cls}`}
                    >
                      {MOVE_BADGE[m.move].text}
                    </span>
                  )}
                  {MOVE_BADGE[m.move] && <br />}
                  {m.text}
                </div>

                {/* Trích dẫn: bấm là mở đúng phần trong bài */}
                {m.citations?.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <p className="px-1 text-[11px] font-medium tracking-wide text-slate-400 uppercase">Nguồn trong tài liệu</p>
                    {m.citations.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => navigate(c.link)}
                        title={c.label}
                        className="flex cursor-pointer items-start gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-xs text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                      >
                        <BookOpen size={13} className="mt-0.5 shrink-0 text-brand-500" />
                        <span className="line-clamp-2">{c.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Chip gợi ý khi trợ giảng hỏi lại — bấm là hỏi luôn, không phải gõ */}
                {m.chips?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.chips.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => send(chip)}
                        disabled={sending}
                        className="flex cursor-pointer items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs text-brand-800 hover:bg-brand-100 disabled:opacity-50"
                      >
                        <CornerDownRight size={12} /> {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ),
          )
        )}
        {sending && (
          <div className="flex items-center gap-2 self-start rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500">
            <Loader2 size={14} className="animate-spin" /> Trợ giảng đang trả lời...
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 p-3">
        {context && (
          <div className="mb-2 flex items-start gap-2 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-2 text-xs text-brand-800">
            <Paperclip size={14} className="mt-0.5 shrink-0" />
            <span className="line-clamp-2 flex-1 italic">“{context}”</span>
            <button onClick={onClearContext} className="cursor-pointer text-brand-500 hover:text-brand-800" title="Bỏ đoạn chọn">
              <X size={14} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={context ? 'Bạn muốn hỏi gì về đoạn này?' : 'Hỏi bất cứ điều gì về tài liệu...'}
            className="max-h-24 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <button
            onClick={() => send()}
            disabled={sending || (!input.trim() && !context)}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUp size={16} />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-slate-400">
          Trợ giảng AI có thể sai – hãy đối chiếu với bài giảng.
        </p>
      </div>
    </aside>
  )
}
