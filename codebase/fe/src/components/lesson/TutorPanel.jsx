import { ArrowUp, Sparkles, X } from 'lucide-react'

// Khung Trợ giảng AI — hiện chỉ là placeholder, tính năng AI sẽ phát triển sau.
export default function TutorPanel({ lessonTitle, userName, onClose }) {
  return (
    <aside className="flex w-[400px] shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-slate-200 px-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Sparkles size={16} className="text-brand-600" /> Trợ giảng AI
        </div>
        <button onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-700" title="Đóng">
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Sparkles />
        </div>
        <p className="mt-4 font-semibold text-slate-800">Hôm nay {userName} muốn hỏi gì nào?</p>
        <p className="mt-1 text-xs text-slate-500">Đang mở: {lessonTitle}</p>
        <span className="mt-4 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          Tính năng đang được phát triển
        </span>
      </div>

      <div className="shrink-0 border-t border-slate-200 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <textarea
            rows={1}
            disabled
            placeholder="Hỏi bất cứ điều gì về tài liệu..."
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <button disabled className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white opacity-50">
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
