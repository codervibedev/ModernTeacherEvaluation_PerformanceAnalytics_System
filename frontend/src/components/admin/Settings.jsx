import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Settings as SettingsIcon, User, Lock, Eye, EyeOff, CalendarRange, Plus, Trash2, Check,
} from 'lucide-react'
import { useAdminAuth } from './AdminAuth'
import ConfirmModal from './ConfirmModal'

const TRIMESTER_NAMES = ['1st Trimester', '2nd Trimester', '3rd Trimester']
const EMPTY_PW = { current: '', next: '', confirm: '' }
const COUNTDOWN_SECONDS = 5

function defaultSchoolYear() {
  const y = new Date().getFullYear()
  return `${y}-${y + 1}`
}

function Notice({ notice }) {
  if (!notice) return null
  const ok = notice.type === 'success'
  return (
    <p
      role={ok ? 'status' : 'alert'}
      className={`rounded-lg border px-3 py-2 text-sm ${
        ok
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-600'
      }`}
    >
      {notice.text}
    </p>
  )
}

function Field({ id, label, required, value, onChange, type = 'text', autoComplete = 'off' }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-[#0c2a5e]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
    </div>
  )
}

function PasswordField({ id, label, value, onChange, show, onToggle, autoComplete }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-[#0c2a5e]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Hide passwords' : 'Show passwords'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

// Dalawang hakbang: (1) "Sigurado ka ba?" → (2) 5-segundong countdown na puwede pang i-cancel.
// Tinatawag lang ang onConfirm kapag umabot sa 0 ang countdown.
function DeleteTrimesterModal({ title, period, busy, error, onConfirm, onCancel }) {
  const [phase, setPhase] = useState('confirm') // 'confirm' | 'countdown'
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS)
  const confirmRef = useRef(onConfirm)
  const firedRef = useRef(false)
  const count = period.evaluation_count

  useEffect(() => {
    confirmRef.current = onConfirm
  })

  // Escape = cancel (hindi habang nagbubura na)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onCancel])

  // Countdown; isang beses lang tatawagin ang delete pagdating sa 0
  useEffect(() => {
    if (phase !== 'countdown') return undefined
    if (seconds <= 0) {
      if (!firedRef.current) {
        firedRef.current = true
        confirmRef.current()
      }
      return undefined
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, seconds])

  // Kapag pumalya ang delete, bumalik sa unang hakbang para makita ang error
  useEffect(() => {
    if (error) {
      firedRef.current = false
      setPhase('confirm')
      setSeconds(COUNTDOWN_SECONDS)
    }
  }, [error])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-trimester-title"
        aria-describedby="delete-trimester-desc"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 id="delete-trimester-title" className="text-lg font-semibold text-[#0c2a5e]">
          Delete Trimester
        </h2>

        {phase === 'confirm' ? (
          <>
            <p id="delete-trimester-desc" className="mt-2 text-sm text-gray-700">
              Are you sure you want to delete <strong>{title}</strong>?{' '}
              {count > 0 ? (
                <>
                  It has <strong>{count}</strong> evaluation{count === 1 ? '' : 's'}, which will be
                  permanently deleted together with their ratings.{' '}
                </>
              ) : null}
              This action cannot be undone.
            </p>

            {error && (
              <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  firedRef.current = false
                  setSeconds(COUNTDOWN_SECONDS)
                  setPhase('countdown')
                }}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
              >
                Yes, Delete
              </button>
            </div>
          </>
        ) : (
          <>
            <p id="delete-trimester-desc" className="mt-2 text-sm text-gray-700">
              <strong>{title}</strong>
              {count > 0 ? ` and its ${count} evaluation${count === 1 ? '' : 's'}` : ''} will be
              permanently deleted. Press Cancel to stop.
            </p>

            <div className="mt-5 text-center" role="status">
              <p className="text-4xl font-bold text-red-600">{seconds > 0 ? seconds : '…'}</p>
              <p className="mt-1 text-sm text-gray-600">
                {seconds > 0 ? `Deleting in ${seconds} second${seconds === 1 ? '' : 's'}...` : 'Deleting...'}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-red-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(seconds / COUNTDOWN_SECONDS) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="rounded-lg border border-[#0c2a5e] px-4 py-2 text-sm font-medium text-[#0c2a5e] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { setAdmin } = useAdminAuth()

  const onAuthError = useCallback(
    (err) => {
      if (err.response?.status === 401) {
        navigate('/admin/login', { replace: true })
        return true
      }
      return false
    },
    [navigate]
  )

  // ------------------------------------------------ Admin account
  const [account, setAccount] = useState(null)
  const [form, setForm] = useState(null)
  const [confirmPw, setConfirmPw] = useState('')
  const [accountNotice, setAccountNotice] = useState(null)
  const [savingAccount, setSavingAccount] = useState(false)

  useEffect(() => {
    axios
      .get('/api/admin/account')
      .then((res) => {
        setAccount(res.data)
        setForm(res.data)
      })
      .catch((err) => {
        if (!onAuthError(err)) setAccountNotice({ type: 'error', text: 'Unable to load your account.' })
      })
  }, [onAuthError])

  const needsPassword =
    account && form && (form.username.trim() !== account.username || form.email.trim() !== account.email)

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const saveAccount = async (e) => {
    e.preventDefault()
    setAccountNotice(null)

    if (!form.first_name.trim() || !form.last_name.trim() || !form.username.trim()) {
      setAccountNotice({ type: 'error', text: 'First name, last name, and username are required.' })
      return
    }
    if (needsPassword && !confirmPw) {
      setAccountNotice({
        type: 'error',
        text: 'Enter your current password to change your username or email.',
      })
      return
    }

    setSavingAccount(true)
    try {
      const res = await axios.put('/api/admin/account', { ...form, current_password: confirmPw })
      setAdmin(res.data) // para mag-update ang pangalan sa header
      setAccount(res.data)
      setForm(res.data)
      setConfirmPw('')
      setAccountNotice({ type: 'success', text: 'Account details saved.' })
    } catch (err) {
      if (!onAuthError(err)) {
        setAccountNotice({
          type: 'error',
          text: err.response?.data?.error || 'Unable to save your account. Please try again.',
        })
      }
    } finally {
      setSavingAccount(false)
    }
  }

  // ------------------------------------------------ Password
  const [pw, setPw] = useState(EMPTY_PW)
  const [showPw, setShowPw] = useState(false)
  const [pwNotice, setPwNotice] = useState(null)
  const [savingPw, setSavingPw] = useState(false)

  const setPwField = (key) => (e) => setPw((p) => ({ ...p, [key]: e.target.value }))

  const changePassword = async (e) => {
    e.preventDefault()
    setPwNotice(null)

    if (!pw.current || !pw.next || !pw.confirm) {
      setPwNotice({ type: 'error', text: 'Please fill in all password fields.' })
      return
    }
    if (pw.next !== pw.confirm) {
      setPwNotice({ type: 'error', text: 'New password and confirmation do not match.' })
      return
    }
    if (pw.next.length < 8 || !/[A-Za-z]/.test(pw.next) || !/\d/.test(pw.next)) {
      setPwNotice({
        type: 'error',
        text: 'Password must be at least 8 characters and contain both letters and numbers.',
      })
      return
    }

    setSavingPw(true)
    try {
      await axios.post('/api/admin/account/password', {
        current_password: pw.current,
        new_password: pw.next,
        confirm_password: pw.confirm,
      })
      setPw(EMPTY_PW)
      setPwNotice({ type: 'success', text: 'Password changed successfully.' })
    } catch (err) {
      if (!onAuthError(err)) {
        setPwNotice({
          type: 'error',
          text: err.response?.data?.error || 'Unable to change your password. Please try again.',
        })
      }
    } finally {
      setSavingPw(false)
    }
  }

  // ------------------------------------------------ Evaluation periods
  const [periods, setPeriods] = useState([])
  const [periodsLoading, setPeriodsLoading] = useState(true)
  const [periodNotice, setPeriodNotice] = useState(null)
  const [newYear, setNewYear] = useState(defaultSchoolYear())
  const [newName, setNewName] = useState(TRIMESTER_NAMES[0])
  const [addingPeriod, setAddingPeriod] = useState(false)
  const [confirm, setConfirm] = useState(null) // { type: 'current' | 'delete', period }
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [confirmError, setConfirmError] = useState('')

  const loadPeriods = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/periods')
      setPeriods(res.data)
    } catch (err) {
      if (!onAuthError(err)) setPeriodNotice({ type: 'error', text: 'Unable to load the evaluation periods.' })
    } finally {
      setPeriodsLoading(false)
    }
  }, [onAuthError])

  useEffect(() => {
    loadPeriods()
  }, [loadPeriods])

  const addPeriod = async (e) => {
    e.preventDefault()
    setPeriodNotice(null)

    const match = /^(\d{4})-(\d{4})$/.exec(newYear.trim())
    if (!match || Number(match[2]) !== Number(match[1]) + 1) {
      setPeriodNotice({ type: 'error', text: 'School year must look like 2025-2026.' })
      return
    }

    setAddingPeriod(true)
    try {
      await axios.post('/api/admin/periods', { school_year: newYear.trim(), trimester_name: newName })
      setPeriodNotice({ type: 'success', text: 'Trimester added.' })
      await loadPeriods()
    } catch (err) {
      if (!onAuthError(err)) {
        setPeriodNotice({
          type: 'error',
          text: err.response?.data?.error || 'Unable to add the trimester.',
        })
      }
    } finally {
      setAddingPeriod(false)
    }
  }

  const runConfirm = async () => {
    setConfirmBusy(true)
    setConfirmError('')
    try {
      const id = confirm.period.trimester_id
      if (confirm.type === 'current') {
        await axios.post(`/api/admin/periods/${id}/current`)
        setPeriodNotice({ type: 'success', text: 'The current trimester has been updated.' })
      } else {
        const count = confirm.period.evaluation_count
        await axios.delete(`/api/admin/periods/${id}`)
        setPeriodNotice({
          type: 'success',
          text:
            count > 0
              ? `Trimester deleted along with its ${count} evaluation${count === 1 ? '' : 's'}.`
              : 'Trimester deleted.',
        })
      }
      setConfirm(null)
      await loadPeriods()
    } catch (err) {
      if (!onAuthError(err)) {
        setConfirmError(err.response?.data?.error || 'Something went wrong. Please try again.')
      }
    } finally {
      setConfirmBusy(false)
    }
  }

  const label = (p) => `${p.trimester_name} (${p.school_year})`
  const currentPeriod = periods.find((p) => p.is_current)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-100 bg-white">
          <SettingsIcon className="h-5 w-5 text-[#0c2a5e]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight text-[#0c2a5e]">Settings</h1>
          <p className="text-sm text-gray-600">
            Manage your administrator account, security, and the evaluation period.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Admin account */}
        <section className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-[#0c2a5e]" />
            <div>
              <h2 className="font-semibold text-[#0c2a5e]">Admin Account</h2>
              <p className="text-xs text-gray-500">Update your personal information and account details.</p>
            </div>
          </div>

          {!form ? (
            <p className="text-sm text-gray-500">Loading account...</p>
          ) : (
            <form onSubmit={saveAccount} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field id="first_name" label="First Name" required value={form.first_name} onChange={setField('first_name')} />
                <Field id="middle_name" label="Middle Name" value={form.middle_name} onChange={setField('middle_name')} />
                <Field id="last_name" label="Last Name" required value={form.last_name} onChange={setField('last_name')} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="username" label="Username" required value={form.username} onChange={setField('username')} autoComplete="username" />
                <Field id="email" label="Email Address" type="email" value={form.email} onChange={setField('email')} autoComplete="email" />
              </div>

              {needsPassword && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="mb-2 text-xs text-amber-800">
                    For your security, enter your current password to change your username or email.
                  </p>
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    aria-label="Current password"
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              )}

              <Notice notice={accountNotice} />

              <button
                type="submit"
                disabled={savingAccount}
                className="rounded-lg bg-[#0c2a5e] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0a2249] disabled:opacity-60"
              >
                {savingAccount ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}
        </section>

        {/* Account security */}
        <section className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#0c2a5e]" />
            <div>
              <h2 className="font-semibold text-[#0c2a5e]">Account Security</h2>
              <p className="text-xs text-gray-500">Change your password to keep your account secure.</p>
            </div>
          </div>

          <form onSubmit={changePassword} className="space-y-3">
            <PasswordField id="current_password" label="Current Password" value={pw.current} onChange={setPwField('current')} show={showPw} onToggle={() => setShowPw((v) => !v)} autoComplete="current-password" />
            <PasswordField id="new_password" label="New Password" value={pw.next} onChange={setPwField('next')} show={showPw} onToggle={() => setShowPw((v) => !v)} autoComplete="new-password" />
            <PasswordField id="confirm_password" label="Confirm New Password" value={pw.confirm} onChange={setPwField('confirm')} show={showPw} onToggle={() => setShowPw((v) => !v)} autoComplete="new-password" />

            <p className="text-xs text-gray-500">
              Password must be at least 8 characters and contain both letters and numbers.
            </p>

            <Notice notice={pwNotice} />

            <button
              type="submit"
              disabled={savingPw}
              className="rounded-lg bg-[#0c2a5e] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0a2249] disabled:opacity-60"
            >
              {savingPw ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </section>
      </div>

      {/* Evaluation period */}
      <section className="mt-4 rounded-xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-[#0c2a5e]" />
          <div>
            <h2 className="font-semibold text-[#0c2a5e]">Evaluation Period</h2>
            <p className="text-xs text-gray-500">
              New evaluations from students are recorded under the current trimester.
              {currentPeriod ? ` Current: ${label(currentPeriod)}.` : ' There is no current trimester yet.'}
            </p>
          </div>
        </div>

        {!currentPeriod && !periodsLoading && (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Students cannot submit evaluations until a trimester is set as current.
          </p>
        )}

        <form onSubmit={addPeriod} className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="school_year" className="mb-1 block text-xs font-medium text-[#0c2a5e]">
              School Year
            </label>
            <input
              id="school_year"
              type="text"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              autoComplete="off"
              className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label htmlFor="trimester_name" className="mb-1 block text-xs font-medium text-[#0c2a5e]">
              Trimester
            </label>
            <select
              id="trimester_name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {TRIMESTER_NAMES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={addingPeriod}
            className="flex items-center gap-2 rounded-lg bg-[#0c2a5e] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0a2249] disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Add Trimester
          </button>
        </form>

        <div className="mb-3">
          <Notice notice={periodNotice} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 pr-3 font-medium">School Year</th>
                <th className="py-2 pr-3 font-medium">Trimester</th>
                <th className="py-2 pr-3 font-medium">Evaluations</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {periodsLoading && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">Loading...</td>
                </tr>
              )}
              {!periodsLoading && periods.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">No trimesters yet.</td>
                </tr>
              )}
              {periods.map((p) => (
                <tr key={p.trimester_id} className="border-b border-gray-100">
                  <td className="py-3 pr-3">{p.school_year}</td>
                  <td className="py-3 pr-3">{p.trimester_name}</td>
                  <td className="py-3 pr-3">{p.evaluation_count}</td>
                  <td className="py-3 pr-3">
                    {p.is_current ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                        <Check className="h-3 w-3" /> Current
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Closed</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {!p.is_current && (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmError('')
                            setConfirm({ type: 'current', period: p })
                          }}
                          className="rounded-md border border-[#0c2a5e] px-3 py-1.5 text-xs text-[#0c2a5e] transition hover:bg-blue-50"
                        >
                          Set as Current
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmError('')
                          setConfirm({ type: 'delete', period: p })
                        }}
                        disabled={p.is_current}
                        aria-label={`Delete ${label(p)}`}
                        title={
                          p.is_current
                            ? 'The current trimester cannot be deleted'
                            : p.evaluation_count > 0
                              ? `Delete (also deletes ${p.evaluation_count} evaluation${p.evaluation_count === 1 ? '' : 's'})`
                              : 'Delete'
                        }
                        className="rounded-md bg-red-500 p-1.5 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {confirm && confirm.type === 'delete' && (
        <DeleteTrimesterModal
          title={label(confirm.period)}
          period={confirm.period}
          busy={confirmBusy}
          error={confirmError}
          onConfirm={runConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm && confirm.type === 'current' && (
        <ConfirmModal
          title="Set as Current Trimester"
          message={`New evaluations will be recorded under ${label(confirm.period)}. Evaluations already submitted will stay in their own trimester.`}
          confirmLabel="Yes, Set as Current"
          danger={false}
          busy={confirmBusy}
          error={confirmError}
          onConfirm={runConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}