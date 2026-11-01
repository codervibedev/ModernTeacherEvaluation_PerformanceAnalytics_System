import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { User, Star, Trophy, FileText, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import PeriodFilter, { SelectCard } from './PeriodFilter'

const LEVEL_STYLES = {
  Excellent: 'bg-emerald-50 text-emerald-700',
  'Very Good': 'bg-blue-50 text-blue-700',
  Good: 'bg-amber-50 text-amber-700',
  'Needs Improvement': 'bg-orange-50 text-orange-700',
  Poor: 'bg-red-50 text-red-700',
}

const LEVEL_COLORS = {
  Excellent: '#10b981',
  'Very Good': '#3b82f6',
  Good: '#f59e0b',
  'Needs Improvement': '#f97316',
  Poor: '#ef4444',
}

const TABS = [
  { id: 'overview', label: 'Evaluation Overview' },
  { id: 'categories', label: 'Category Breakdown' },
  { id: 'trends', label: 'Trends' },
]

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function Change({ value }) {
  if (value == null) return <span className="text-gray-400">No previous trimester to compare</span>
  if (value === 0) return <span className="text-gray-500">No change vs previous trimester</span>
  const up = value > 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-1 ${up ? 'text-emerald-600' : 'text-red-600'}`}>
      <Icon className="h-3.5 w-3.5" />
      {up ? '+' : ''}
      {value.toFixed(2)} vs previous trimester
    </span>
  )
}

function LevelBadge({ level }) {
  if (!level) return null
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${LEVEL_STYLES[level]}`}>{level}</span>
  )
}

function Bar({ value, level }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${((value ?? 0) / 5) * 100}%`, background: LEVEL_COLORS[level] || '#9ca3af' }}
      />
    </div>
  )
}

export default function TeacherProfile() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const teacherId = params.get('teacher_id')
  const trimesterId = params.get('trimester_id')

  const [teachers, setTeachers] = useState([])
  const [trimesters, setTrimesters] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('overview')
  const [openCategory, setOpenCategory] = useState(null)

  // Listahan ng teachers at trimesters (para sa mga filter)
  useEffect(() => {
    axios
      .get('/api/admin/teachers')
      .then((res) => setTeachers(res.data))
      .catch((err) => {
        if (err.response?.status === 401) navigate('/admin/login', { replace: true })
      })
    axios
      .get('/api/admin/trimesters')
      .then((res) => setTrimesters(res.data))
      .catch(() => {})
  }, [navigate])

  // Kung walang napiling teacher, piliin ang una
  useEffect(() => {
    if (!teacherId && teachers.length > 0) {
      setParams({ teacher_id: String(teachers[0].teacher_id) }, { replace: true })
    }
  }, [teacherId, teachers, setParams])

  // Kunin ang profile sa tuwing nagbabago ang teacher o trimester
  useEffect(() => {
    if (!teacherId) return
    let cancelled = false
    setLoading(true)
    axios
      .get('/api/admin/analytics/teacher-profile', {
        params: { teacher_id: teacherId, ...(trimesterId ? { trimester_id: trimesterId } : {}) },
      })
      .then((res) => {
        if (cancelled) return
        setData(res.data)
        setError('')
        setOpenCategory(null)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.response?.status === 401) {
          navigate('/admin/login', { replace: true })
        } else {
          setError(err.response?.data?.error || 'Unable to load the teacher profile.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [teacherId, trimesterId, navigate])

  const pick = (key) => (e) => {
    const next = new URLSearchParams(params)
    next.set(key, e.target.value)
    setParams(next)
  }

  // Ang PeriodFilter ay nagbibigay ng numeric trimester_id (hindi event)
  const pickTrimester = (id) => {
    const next = new URLSearchParams(params)
    next.set('trimester_id', String(id))
    setParams(next)
  }

  const overall = data?.overall
  const empty = !overall || overall.total_evaluations === 0

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-100 bg-white">
          <User className="h-5 w-5 text-[#0c2a5e]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight text-[#0c2a5e]">Teacher Profile</h1>
          <p className="text-sm text-gray-600">
            View detailed evaluation results and performance summary of the selected teacher.
          </p>
        </div>
      </div>

      {/* Filters: Teacher → Academic Year → Trimester */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-5">
        <SelectCard
          id="filter-teacher"
          label="Teacher"
          value={teacherId ?? ''}
          onChange={pick('teacher_id')}
          disabled={teachers.length === 0}
          widthClass="sm:min-w-[16rem]"
        >
          {teachers.map((t) => (
            <option key={t.teacher_id} value={t.teacher_id}>
              Prof. {t.first_name} {t.last_name}
              {t.is_active ? '' : ' (Inactive)'}
            </option>
          ))}
        </SelectCard>

        <PeriodFilter
          trimesters={trimesters}
          value={data?.trimester.trimester_id ?? trimesterId ?? ''}
          onChange={pickTrimester}
        />
      </div>

      {teachers.length === 0 && (
        <p className="rounded-lg border border-blue-100 bg-white px-4 py-3 text-sm text-gray-600">
          There are no teachers yet. Add teachers in Teacher Management.
        </p>
      )}

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading && !data && teachers.length > 0 && <p className="text-sm text-gray-500">Loading profile...</p>}

      {data && (
        <div className={loading ? 'opacity-60 transition' : 'transition'}>
          {/* Profile + stat cards */}
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#0c2a5e] text-lg font-bold text-white">
                  {initials(data.teacher.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-[#0c2a5e]">Prof. {data.teacher.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      data.teacher.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {data.teacher.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">{data.trimester.label}</p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Overall Rating</p>
                  <p className="text-2xl font-bold text-[#0c2a5e]">
                    {overall.average != null ? overall.average.toFixed(2) : 'N/A'}
                    <span className="text-sm font-normal text-gray-500"> / 5.00</span>
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <LevelBadge level={overall.level} />
                <div>
                  <Change value={overall.change} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Rank</p>
                  <p className="text-2xl font-bold text-[#0c2a5e]">
                    {overall.rank != null ? ordinal(overall.rank) : 'N/A'}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                {overall.rank != null
                  ? `Out of ${overall.ranked_count} ranked ${overall.ranked_count === 1 ? 'teacher' : 'teachers'}`
                  : 'Not ranked (no evaluations)'}
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Evaluations</p>
                  <p className="text-2xl font-bold text-[#0c2a5e]">{overall.total_evaluations}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">Submitted this trimester</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 rounded-xl border border-blue-100 bg-white shadow-sm">
            <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-gray-200 px-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm transition ${
                    tab === t.id
                      ? 'border-[#0c2a5e] font-semibold text-[#0c2a5e]'
                      : 'border-transparent text-gray-500 hover:text-[#0c2a5e]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-6">
              {/* Evaluation Overview */}
              {tab === 'overview' &&
                (empty ? (
                  <p className="py-8 text-center text-sm text-gray-500">
                    This teacher has no evaluations in this trimester yet.
                  </p>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <p className="mb-3 text-sm font-semibold text-[#0c2a5e]">Average Rating per Category</p>
                      <ul className="space-y-3">
                        {data.categories.map((c) => (
                          <li key={c.category_id}>
                            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                              <span className="text-gray-700">{c.name}</span>
                              <span className="font-semibold text-[#0c2a5e]">
                                {c.average != null ? c.average.toFixed(2) : 'N/A'}
                              </span>
                            </div>
                            <Bar value={c.average} level={c.level} />
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                      <p className="mb-2 text-sm font-semibold text-[#0c2a5e]">Performance Insight</p>
                      <p className="text-sm leading-relaxed text-gray-700">
                        Overall performance for this trimester is rated{' '}
                        <strong>{overall.level}</strong> ({overall.average.toFixed(2)} / 5.00).
                        {data.strongest && data.weakest && data.strongest.category_id !== data.weakest.category_id && (
                          <>
                            {' '}
                            The highest rated category is <strong>{data.strongest.name}</strong> (
                            {data.strongest.average.toFixed(2)}), while <strong>{data.weakest.name}</strong> (
                            {data.weakest.average.toFixed(2)}) has the most room for improvement.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                ))}

              {/* Category Breakdown */}
              {tab === 'categories' &&
                (empty ? (
                  <p className="py-8 text-center text-sm text-gray-500">
                    This teacher has no evaluations in this trimester yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.categories.map((c) => {
                      const open = openCategory === c.category_id
                      return (
                        <div key={c.category_id} className="overflow-hidden rounded-lg border border-gray-200">
                          <button
                            type="button"
                            onClick={() => setOpenCategory(open ? null : c.category_id)}
                            aria-expanded={open}
                            className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-blue-50 sm:p-4"
                          >
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#0c2a5e]">
                              {c.name}
                            </span>
                            <span className="text-sm font-semibold text-[#0c2a5e]">
                              {c.average != null ? c.average.toFixed(2) : 'N/A'}
                            </span>
                            <span className="hidden sm:inline">
                              <LevelBadge level={c.level} />
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                                open ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {open && (
                            <ul className="divide-y divide-gray-100 border-t border-gray-100 bg-gray-50/50 px-3 sm:px-4">
                              {c.aspects.map((a) => (
                                <li key={a.aspect_id} className="flex items-center gap-3 py-3">
                                  <span className="min-w-0 flex-1 text-sm text-gray-700">{a.name}</span>
                                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#0c2a5e]">
                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                    {a.average != null ? a.average.toFixed(2) : 'N/A'}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}

              {/* Trends */}
              {tab === 'trends' && (
                <div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.trend} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => (v == null ? 'No data' : v.toFixed(2))} />
                        <Line
                          type="monotone"
                          dataKey="average"
                          name="Average rating"
                          stroke="#0c2a5e"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-500">
                          <th className="py-2 pr-3 font-medium">Trimester</th>
                          <th className="py-2 pr-3 font-medium">Average Rating</th>
                          <th className="py-2 font-medium">Evaluations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.trend.map((t) => (
                          <tr key={t.label} className="border-b border-gray-100">
                            <td className="py-3 pr-3">{t.label}</td>
                            <td className="py-3 pr-3 font-semibold text-[#0c2a5e]">
                              {t.average != null ? t.average.toFixed(2) : 'No data'}
                            </td>
                            <td className="py-3">{t.evaluations}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}