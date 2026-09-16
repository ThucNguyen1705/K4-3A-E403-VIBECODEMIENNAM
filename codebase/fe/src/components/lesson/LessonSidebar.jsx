import { Check, X } from 'lucide-react'
import clsx from 'clsx'

export default function LessonSidebar({ lesson, selectedId, onSelect, doneIds, onClose }) {
  return (
    <aside className="thin-scroll flex w-[280px] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
        <span className="text-xs font-bold tracking-widest text-slate-700 uppercase">Nội dung bài học</span>
        <button onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-700" title="Thu gọn">
          <X size={16} />
        </button>
      </div>

      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-[15px] font-semibold text-slate-800">{lesson.topic}</p>
        {lesson.summary && <p className="mt-1 text-xs leading-5 text-slate-500">{lesson.summary}</p>}
      </div>

      <nav className="py-2">
        {lesson.parts.map((part) => {
          const active = part.id === selectedId
          const done = doneIds.includes(part.id)
          return (
            <button
              key={part.id}
              onClick={() => onSelect(part.id)}
              title={part.title}
              className={clsx(
                'flex w-full cursor-pointer items-center gap-2.5 border-l-[3px] py-2.5 pr-3 pl-4 text-left text-sm transition',
                active
                  ? 'border-brand-600 bg-brand-50 font-semibold text-brand-800'
                  : 'border-transparent text-slate-700 hover:bg-slate-50',
              )}
            >
              <span
                className={clsx(
                  'grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] font-semibold',
                  done
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : active
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-400 text-slate-600',
                )}
              >
                {done ? <Check size={12} strokeWidth={3} /> : part.position}
              </span>
              <span className="min-w-0 flex-1 truncate">{part.title}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
