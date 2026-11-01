import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Trophy, User, LayoutGrid, CalendarRange, Lightbulb,
  Users, Settings, Menu, X, LogOut,
} from 'lucide-react'
import logoImage from '../../assets/LOGOICCT.png'
import { useAdminAuth } from './AdminAuth'
import ConfirmModal from './ConfirmModal'

const MAIN_NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/ranking', label: 'Performance Ranking', icon: Trophy },
  { to: '/admin/teacher-profile', label: 'Teacher Profile', icon: User },
  { to: '/admin/category-breakdown', label: 'Category Breakdown', icon: LayoutGrid },
  { to: '/admin/trimester-comparison', label: 'Trimester Comparison', icon: CalendarRange },
  { to: '/admin/insights', label: 'Performance Insights', icon: Lightbulb },
]

const MANAGE_NAV = [
  { to: '/admin/teachers', label: 'Teachers', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'A'
  )
}

function NavItem({ item, onClick }) {
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
          isActive
            ? 'bg-blue-600 font-medium text-white'
            : 'text-blue-100 hover:bg-white/10'
        }`
      }
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.label}
    </NavLink>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const { admin, logout } = useAdminAuth()
  const [open, setOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
      setConfirmLogout(false)
      navigate('/admin/login', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Top header */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center bg-[#0c2a5e] px-4 text-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="rounded-md p-1.5 hover:bg-white/10 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <img src={logoImage} alt="ICCT logo" className="h-9 w-9 rounded-full object-cover" />
          <div className="border-l border-white/30 pl-3">
            <p className="text-sm font-bold leading-tight tracking-wider">ICCT COLLEGES</p>
            <p className="text-[9px] leading-tight tracking-[0.3em] text-blue-200">FOUNDATION, INC.</p>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed bottom-0 left-0 top-14 z-40 flex w-60 flex-col border-t border-white/10 bg-[#0c2a5e] transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {MAIN_NAV.map((item) => (
            <NavItem key={item.to} item={item} onClick={() => setOpen(false)} />
          ))}
          <div className="my-3 border-t border-white/10" />
          {MANAGE_NAV.map((item) => (
            <NavItem key={item.to} item={item} onClick={() => setOpen(false)} />
          ))}
        </nav>

        {/* Admin + Logout (nasa baba) */}
        <div className="border-t border-white/10 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {initials(admin?.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{admin?.name}</p>
              <p className="text-[11px] text-blue-200">Administrator</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setConfirmLogout(true)
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-blue-100 transition hover:bg-red-500/20 hover:text-white"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Page content */}
      <main className="pt-14 lg:pl-60">
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>

      {confirmLogout && (
        <ConfirmModal
          title="Log Out"
          message="Are you sure you want to log out of your administrator account?"
          confirmLabel="Log Out"
          danger
          busy={loggingOut}
          onConfirm={handleLogout}
          onCancel={() => setConfirmLogout(false)}
        />
      )}
    </div>
  )
}