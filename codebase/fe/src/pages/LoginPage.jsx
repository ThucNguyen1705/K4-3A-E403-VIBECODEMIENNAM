import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthLayout, { AuthField } from '../components/AuthLayout'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <AuthLayout title="Đăng nhập" subtitle="Chào mừng quay lại! Tiếp tục hành trình học của bạn.">
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <AuthField
          label="Email"
          icon={Mail}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <AuthField
          label="Mật khẩu"
          icon={Lock}
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••"
        />

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

      <p className="mt-6 text-center text-sm text-slate-600">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:underline">
          Đăng ký ngay
        </Link>
      </p>

      <div className="mt-4 rounded-lg border border-dashed border-brand-200 bg-brand-50 p-3 text-xs text-brand-800">
        <strong>Tài khoản demo</strong> (sau khi chạy <code>npm run seed</code> ở backend): demo@vlearn.dev / 123456
      </div>
    </AuthLayout>
  )
}
