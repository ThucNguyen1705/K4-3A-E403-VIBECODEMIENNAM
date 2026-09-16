import { NavLink } from 'react-router-dom'
import { Bell, BookOpen, FlaskConical, Home, Moon, Dumbbell } from 'lucide-react'
import clsx from 'clsx'
import Logo from './Logo'
import UserMenu from './UserMenu'

const navItems = [
  { to: '/dashboard', label: 'Trang chủ', icon: Home },
  { to: '#courses', label: 'Khóa học', icon: BookOpen },
  { to: '#practice', label: 'Luyện tập', icon: Dumbbell, badge: 'Sắp ra mắt' },
  { to: '#lab', label: 'Lab', icon: FlaskConical, badge: 'Mới', badgeRed: true },
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-6">
        <Logo />

        <nav className="hidden h-full items-center gap-1 md:flex">
          {navItems.map(({ to, label, icon: Icon, badge, badgeRed }) =>
            to.startsWith('#') ? (
              <span
                key={label}
                className="flex h-full cursor-not-allowed items-center gap-2 px-3 text-sm font-medium text-slate-600"
              >
                <Icon size={18} />
                {label}
                {badge && (
                  <span
                    className={clsx(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                      badgeRed ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-700',
                    )}
                  >
                    {badge}
                  </span>
                )}
              </span>
            ) : (
              <NavLink
                key={label}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex h-full items-center gap-2 border-b-2 px-3 text-sm font-semibold transition',
                    isActive
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-slate-600 hover:text-brand-700',
                  )
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-slate-200 text-[11px] font-bold">
            <span className="px-1.5 py-1 text-slate-500">EN</span>
            <span className="bg-brand-600 px-1.5 py-1 text-white">VI</span>
          </div>
          <button className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-slate-500 hover:bg-slate-100">
            <Moon size={18} />
          </button>
          <button className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-slate-500 hover:bg-slate-100">
            <Bell size={18} />
          </button>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
