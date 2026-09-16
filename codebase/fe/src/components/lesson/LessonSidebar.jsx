import { useState } from 'react'
import { Check, ChevronDown, Code2, FlaskConical, Presentation, X } from 'lucide-react'
import clsx from 'clsx'

function Collapsible({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-slate-200">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-[15px] font-semibold text-slate-800 hover:bg-slate-50"
      >
        {icon}
        <span className="flex-1 truncate">{title}</span>
        <ChevronDown size={16} className={clsx('text-slate-500 transition', !open && '-rotate-90')} />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  )
}

function Item({ active, done, onClick, leading, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={clsx(
        'flex w-full cursor-pointer items-center gap-2.5 border-l-[3px] py-2.5 pr-3 pl-4 text-left text-sm transition',
        active
          ? 'border-brand-600 bg-brand-50 font-semibold text-brand-800'
          : 'border-transparent text-slate-700 hover:bg-slate-50',
      )}
    >
      {leading}
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {active ? (
        <span className="shrink-0 text-xs font-semibold text-brand-700">Đang học</span>
      ) : (
        done && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-emerald-600">
            <Check size={14} /> Đã xong
          </span>
        )
      )}
    </button>
  )
}

export default function LessonSidebar({ lesson, selected, onSelect, doneKeys, numbering, onClose }) {
  return (
    <aside className="thin-scroll flex w-[280px] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
        <span className="text-xs font-bold tracking-widest text-slate-700 uppercase">Nội dung bài học</span>
        <button onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-700" title="Thu gọn">
          <X size={16} />
        </button>
      </div>

      <Collapsible title="Slides">
        {lesson.slides.map((s) => {
          const key = `slide:${s.id}`
          return (
            <Item
              key={key}
              title={s.title}
              active={selected === key}
              done={s.done || doneKeys.includes(key)}
              onClick={() => onSelect(key)}
              leading={<Presentation size={16} className="shrink-0 text-amber-500" />}
            />
          )
        })}
      </Collapsible>

      {lesson.labs.map((lab) => (
        <Collapsible
          key={lab.id}
          title={lab.title}
          icon={
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700">
              <FlaskConical size={14} />
            </span>
          }
        >
          {lab.groups.map((g) => (
            <div key={g.id} className={clsx(g.title && 'mt-2 border-t border-slate-100 pt-3')}>
              {g.title && (
                <p className="truncate px-4 pb-1 text-sm font-semibold text-slate-800" title={g.title}>
                  {g.title}
                </p>
              )}
              {g.parts.map((p) => {
                const key = `${lab.id}:${p.id}`
                const active = selected === key
                return (
                  <Item
                    key={key}
                    title={p.title}
                    active={active}
                    done={doneKeys.includes(key)}
                    onClick={() => onSelect(key)}
                    leading={
                      p.type === 'code' ? (
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                          <Code2 size={12} />
                        </span>
                      ) : (
                        <span
                          className={clsx(
                            'grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] font-semibold',
                            active
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : doneKeys.includes(key)
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-slate-400 text-slate-600',
                          )}
                        >
                          {numbering[key]}
                        </span>
                      )
                    }
                  />
                )
              })}
            </div>
          ))}
        </Collapsible>
      ))}
    </aside>
  )
}
