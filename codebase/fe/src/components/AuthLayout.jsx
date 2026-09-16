import { useState } from 'react'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import Logo from './Logo'

export function AuthField({ label, icon: Icon, type = 'text', ...inputProps }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-slate-300 px-3 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
        <Icon size={18} className="text-slate-400" />
        <input
          {...inputProps}
          type={isPassword && show ? 'text' : type}
          className="h-11 flex-1 bg-transparent text-sm outline-none"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="cursor-pointer text-slate-400 hover:text-slate-600"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </label>
  )
}

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-full">
      {/* Cột trái — giới thiệu */}
      <div className="relative hidden flex-1 overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 lg:flex">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-[28rem] w-[28rem] rounded-full bg-sky-400/20 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2 text-2xl font-extrabold">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-700">V</div>
            VLearn
          </div>
          <div className="max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
              <Sparkles size={14} /> Học cùng Trợ giảng AI
            </span>
            <h1 className="mt-5 text-4xl leading-tight font-bold">
              Học mỗi ngày một bài,
              <br /> tiến bộ mỗi ngày một chút.
            </h1>
            <p className="mt-4 text-brand-100">
              Theo dõi khóa học, mở bài học theo từng ngày và thực hành lab ngay trên một nền tảng.
            </p>
          </div>
          <p className="text-sm text-brand-200">© 2026 VLearn · Mock project</p>
        </div>
      </div>

      {/* Cột phải — form */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo size="lg" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-slate-900 lg:mt-0">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
