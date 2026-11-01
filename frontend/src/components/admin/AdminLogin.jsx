
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  User,
  LockKeyhole,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
} from 'lucide-react'

import heroImage from '../../assets/school.png'
import logoImage from '../../assets/LOGOICCT.png'
import { useAdminAuth } from './AdminAuth'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { admin, loading: checking, login } = useAdminAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c2145]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
      </div>
    )
  }

  if (admin) {
    return <Navigate to="/admin/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Please enter your username and password.')
      return
    }

    setLoading(true)

    try {
      await login(username.trim(), password)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Unable to reach the server. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#0c2145] px-4 py-8 sm:px-6">

      {/* Background image - admin login only */}
      <img
        src={heroImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 -z-10 bg-[#081b3b]/65" />

      {/* Subtle blue lighting */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 50% 35%, rgba(37,99,235,0.18), transparent 65%)',
        }}
      />

      {/* Login card */}
      <section className="relative w-full max-w-[420px] rounded-2xl border border-white/15 bg-[#0c2a55]/90 px-6 py-8 shadow-2xl shadow-black/30 backdrop-blur-xl sm:px-10 sm:py-9">

        {/* Institution branding */}
        <div className="mb-7 flex flex-col items-center text-center">
          <img
            src={logoImage}
            alt="ICCT Colleges logo"
            className="mb-5 h-[76px] w-[76px] object-contain"
          />

          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300">
            ICCT Colleges Foundation, Inc.
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[28px]">
            Admin Login
          </h1>

          <p className="mt-2 text-sm text-blue-200/80">
            Sign in to your account
          </p>

          <div className="mt-5 h-1 w-12 rounded-full bg-blue-500" />
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium text-blue-50"
            >
              Username
            </label>

            <div className="relative">
              <User
                size={18}
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300"
              />

              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                required
                disabled={loading}
                className="h-[50px] w-full rounded-xl border border-white/15 bg-white/[0.07] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-blue-200/45 hover:border-white/25 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-blue-50"
            >
              Password
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300"
              />

              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={loading}
                className="h-[50px] w-full rounded-xl border border-white/15 bg-white/[0.07] pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-blue-200/45 hover:border-white/25 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-blue-200/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p
              role="alert"
              aria-live="polite"
              className="rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex h-[50px] w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#0c2a55] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Security footer */}
        <div className="mt-7 border-t border-white/10 pt-5">
          <div className="flex items-center justify-center gap-2 text-xs text-blue-200/70">
            <ShieldCheck size={15} className="shrink-0 text-sky-300" />
            <span>Authorized access only</span>
          </div>
        </div>
      </section>
    </main>
  )
}