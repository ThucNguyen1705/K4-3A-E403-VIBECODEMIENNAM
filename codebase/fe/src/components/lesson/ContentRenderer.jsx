import { useState } from 'react'
import { AlertTriangle, Check, CheckCircle2, Copy } from 'lucide-react'
import clsx from 'clsx'

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="my-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2 text-xs text-slate-400">
        <span className="font-mono">{lang}</span>
        <button onClick={copy} className="flex cursor-pointer items-center gap-1 hover:text-white">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Đã copy' : 'Copy'}
        </button>
      </div>
      <pre className="thin-scroll overflow-x-auto p-4 text-[13px] leading-relaxed text-sky-200">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function ContentRenderer({ blocks }) {
  return blocks.map((b, i) => {
    switch (b.type) {
      case 'heading':
        return (
          <h2 key={i} className="mt-9 mb-3 text-2xl font-bold text-slate-900">
            {b.text}
          </h2>
        )
      case 'paragraph':
        return b.html ? (
          <p
            key={i}
            className="my-3 text-[15px] leading-7 text-slate-700 [&_strong]:text-slate-900"
            dangerouslySetInnerHTML={{ __html: b.html }}
          />
        ) : (
          <p key={i} className="my-3 text-[15px] leading-7 text-slate-700">
            {b.text}
          </p>
        )
      case 'callout': {
        const warn = b.variant === 'warning'
        const Icon = warn ? AlertTriangle : CheckCircle2
        return (
          <div
            key={i}
            className={clsx(
              'my-5 flex gap-3 rounded-xl border p-4',
              warn ? 'border-amber-200 bg-amber-50' : 'border-brand-300 bg-brand-50/60',
            )}
          >
            <Icon size={20} className={clsx('mt-0.5 shrink-0', warn ? 'text-amber-600' : 'text-brand-700')} />
            <div>
              <p className="text-sm font-bold text-slate-900">{b.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{b.text}</p>
            </div>
          </div>
        )
      }
      case 'checklist':
        return (
          <div key={i} className="my-4 space-y-3">
            {b.items.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              >
                <Check size={18} className="mt-0.5 shrink-0 text-brand-600" />
                {item}
              </div>
            ))}
          </div>
        )
      case 'list':
        return (
          <ul key={i} className="my-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700 marker:text-brand-500">
            {b.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )
      case 'code':
        return <CodeBlock key={i} code={b.code} lang={b.lang} />
      default:
        return null
    }
  })
}
