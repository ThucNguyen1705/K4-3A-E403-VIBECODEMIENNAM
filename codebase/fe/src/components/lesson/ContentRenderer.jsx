import { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy, Info } from 'lucide-react'

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
        <span className="font-mono">{lang || 'text'}</span>
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

// Map từng thẻ markdown sang style của VLearn
const components = {
  h1: ({ children }) => <h2 className="mt-9 mb-3 text-2xl font-bold text-slate-900">{children}</h2>,
  h2: ({ children }) => <h2 className="mt-9 mb-3 text-2xl font-bold text-slate-900">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-6 mb-2 text-lg font-semibold text-slate-900">{children}</h3>,
  p: ({ children }) => <p className="my-3 text-[15px] leading-7 text-slate-700">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="font-medium text-brand-600 hover:underline">
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1.5 pl-6 text-[15px] leading-7 text-slate-700 marker:text-brand-500">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1.5 pl-6 text-[15px] leading-7 text-slate-700 marker:font-semibold marker:text-brand-600">
      {children}
    </ol>
  ),
  blockquote: ({ children }) => (
    <div className="my-5 flex gap-3 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-1">
      <Info size={20} className="mt-4 shrink-0 text-brand-700" />
      <div className="[&_p]:my-3 [&_p]:text-sm [&_p]:leading-6">{children}</div>
    </div>
  ),
  table: ({ children }) => (
    <div className="thin-scroll my-5 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50 text-slate-900">{children}</thead>,
  th: ({ children }) => <th className="border-b border-slate-200 px-4 py-2.5 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-slate-100 px-4 py-2.5 text-slate-700">{children}</td>,
  hr: () => <hr className="my-8 border-slate-200" />,
  pre: ({ children }) => children,
  code: ({ className, children }) => {
    const lang = /language-(\w+)/.exec(className ?? '')?.[1]
    const text = String(children)
    // Khối code (có ngôn ngữ hoặc nhiều dòng) vs inline code
    if (lang || text.includes('\n')) return <CodeBlock code={text.replace(/\n$/, '')} lang={lang} />
    return (
      <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-brand-800">{children}</code>
    )
  },
}

export default function ContentRenderer({ content }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </Markdown>
  )
}
