import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Lock, Mail, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('demo@vlearn.dev')
  const [password, setPassword] = useState('123456')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
          <h2 className="mt-6 text-2xl font-bold text-slate-900 lg:mt-0">Đăng nhập</h2>
          <p className="mt-1 text-sm text-slate-500">Chào mừng quay lại! Tiếp tục hành trình học của bạn.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-slate-300 px-3 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
                <Mail size={18} className="text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 flex-1 bg-transparent text-sm outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Mật khẩu</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-slate-300 px-3 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
                <Lock size={18} className="text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 flex-1 bg-transparent text-sm outline-none"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="accent-brand-600" defaultChecked /> Ghi nhớ đăng nhập
              </label>
              <a href="#" className="font-medium text-brand-600 hover:underline">
                Quên mật khẩu?
              </a>
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-600 font-semibold text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-70"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Đăng nhập
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-dashed border-brand-200 bg-brand-50 p-3 text-xs text-brand-800">
            <strong>Tài khoản demo:</strong> demo@vlearn.dev / 123456
          </div>
        </div>
      </div>
    </div>
  )
}
