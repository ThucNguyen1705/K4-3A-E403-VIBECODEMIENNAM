import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Lock, Mail, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthLayout, { AuthField } from '../components/AuthLayout'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự')
    if (form.password !== form.confirm) return setError('Mật khẩu nhập lại không khớp')

    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Tạo tài khoản" subtitle="Đăng ký để bắt đầu học cùng VLearn.">
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <AuthField
          label="Họ và tên"
          icon={User}
          required
          autoComplete="name"
          value={form.name}
          onChange={set('name')}
          placeholder="Nguyễn Văn A"
        />
        <AuthField
          label="Email"
          icon={Mail}
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          placeholder="you@example.com"
        />
        <AuthField
          label="Mật khẩu"
          icon={Lock}
          type="password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          placeholder="Tối thiểu 6 ký tự"
        />
        <AuthField
          label="Nhập lại mật khẩu"
          icon={Lock}
          type="password"
          required
          autoComplete="new-password"
          value={form.confirm}
          onChange={set('confirm')}
          placeholder="••••••"
        />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-600 font-semibold text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-70"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          Đăng ký
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  )
}
