import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Lightbulb, Star, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, ArrowRight,
} from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import PeriodFilter, { SelectCard } from './PeriodFilter'

const round2 = (n) => Math.round(n * 100) / 100

// Parehong scale ng backend
function levelOf(avg) {
  if (avg == null) return null
  if (avg >= 4.5) return 'Excellent'
  if (avg >= 3.5) return 'Very Good'
  if (avg >= 2.5) return 'Good'
  if (avg >= 1.5) return 'Needs Improvement'
  return 'Poor'
}

// Mataas ang rating kung Excellent o Very Good (gamit ang umiiral na levelOf)
const isHigh = (r) => r.level === 'Excellent' || r.level === 'Very Good'

const LEVEL_STYLES = {
  Excellent: 'bg-emerald-50 text-emerald-700',
  'Very Good': 'bg-blue-50 text-blue-700',
  Good: 'bg-amber-50 text-amber-700',
  'Needs Improvement': 'bg-orange-50 text-orange-700',
  Poor: 'bg-red-50 text-red-700',
}

function LevelBadge({ level }) {
  if (!level) return null
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${LEVEL_STYLES[level]}`}>{level}</span>
}

function Delta({ value, suffix = '' }) {
  if (value == null) return <span className="text-gray-400">—</span>
  if (value === 0) return <span className="text-gray-500">0.00{suffix}</span>
  const up = value > 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${up ? 'text-emerald-600' : 'text-red-600'}`}>
      <Icon className="h-3.5 w-3.5" />
      {up ? '+' : ''}
      {value.toFixed(2)}
      {suffix}
    </span>
  )
}

// Para lang sa mga category na mas mababa sa Very Good
function improvementNote(level) {
  if (level === 'Good') return 'There is room for improvement.'
  return 'This category needs attention.'
}

export default function PerformanceInsights() {
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState([])
  const [allTrimesters, setAllTrimesters] = useState([])
  const [teacherId, setTeacherId] = useState('')
  const [trimesterId, setTrimesterId] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(
    async (tid) => {
      setLoading(true)
      try {
        const res = await axios.get('/api/admin/analytics/trimester-comparison', {
          params: tid ? { teacher_id: tid } : {},
        })
        setData(res.data)
        setError('')
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/admin/login', { replace: true })
        } else {
          setError('Unable to load the insights. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    },
    [navigate]
  )

  useEffect(() => {
    load('')
    axios
      .get('/api/admin/teachers')
      .then((res) => setTeachers(res.data))
      .catch(() => {})
    // Pinagmumulan ng school_year, trimester_name at is_current para sa PeriodFilter
    axios
      .get('/api/admin/trimesters')
      .then((res) => setAllTrimesters(res.data))
      .catch(() => {})
  }, [load])

  const view = useMemo(() => {
    if (!data) return null

    const withData = data.trimesters.filter((t) => t.has_data)
    if (withData.length === 0) return { empty: true, withData }

    const selected =
      withData.find((t) => t.trimester_id === Number(trimesterId)) ?? withData[withData.length - 1]
    const selIndex = data.trimesters.findIndex((t) => t.trimester_id === selected.trimester_id)

    // Pinakahuling naunang trimester na may data
    let prevIndex = -1
    for (let i = selIndex - 1; i >= 0; i -= 1) {
      if (data.trimesters[i].has_data) {
        prevIndex = i
        break
      }
    }
    const previous = prevIndex >= 0 ? data.trimesters[prevIndex] : null

    const rows = data.categories.map((c) => {
      const current = c.values[selIndex]
      const prev = prevIndex >= 0 ? c.values[prevIndex] : null
      return {
        ...c,
        current,
        prev,
        level: levelOf(current),
        change: current != null && prev != null ? round2(current - prev) : null,
      }
    })

    // Pinakamataas muna; magkapantay ay inaayos ayon sa category_id
    const rated = rows
      .filter((r) => Number.isFinite(r.current))
      .sort((a, b) => b.current - a.current || a.category_id - b.category_id)
    // Batay sa aktwal na rating level, hindi sa posisyon
    const strengths = rated.filter(isHigh)
    const improve = rated
      .filter((r) => !isHigh(r))
      .sort((a, b) => a.current - b.current || a.category_id - b.category_id) // pinakamababa muna

    const improving = rows.filter((r) => r.change != null && r.change > 0)
    const mostImproved = improving.length
      ? improving.reduce((a, b) => (b.change > a.change ? b : a))
      : null

    const overallChange =
      selected.average != null && previous?.average != null
        ? round2(selected.average - previous.average)
        : null

    const first = withData[0]
    const totalChange =
      withData.length > 1 && first.average != null && selected.average != null
        ? round2(selected.average - first.average)
        : null

    return {
      empty: false,
      withData, selected, previous, rows, rated, strengths, improve,
      mostImproved, overallChange, totalChange,
      trend: withData.map((t) => ({ label: t.short, average: t.average })),
      chartData: rows.map((r) => ({
        name: r.name,
        previous: r.prev,
        current: r.current,
      })),
    }
  }, [data, trimesterId])

  // Mga trimester na may evaluation lang ang lalabas sa Academic Year at Trimester filters
  const periods = useMemo(() => {
    if (!data) return []
    const ids = new Set(data.trimesters.filter((t) => t.has_data).map((t) => t.trimester_id))
    return allTrimesters.filter((t) => ids.has(t.trimester_id))
  }, [data, allTrimesters])

  const rated = view?.rated ?? []
  const highest = rated[0]
  const lowest = rated[rated.length - 1]
  // May totoong pagkakaiba lang kung magkaiba ang pinakamataas at pinakamababa
  const hasSpread = rated.length > 1 && highest.current > lowest.current
  const allTied = rated.length > 1 && !hasSpread
  const highestNames = hasSpread ? rated.filter((r) => r.current === highest.current).map((r) => r.name) : []
  const lowestNames = hasSpread ? rated.filter((r) => r.current === lowest.current).map((r) => r.name) : []

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-100 bg-white">
          <Lightbulb className="h-5 w-5 text-[#0c2a5e]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight text-[#0c2a5e]">Performance Insights</h1>
          <p className="text-sm text-gray-600">
            Key insights from the evaluation results to help improve teaching performance and student learning.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading && !data && <p className="text-sm text-gray-500">Loading insights...</p>}

      {data && view && (
        <div className={loading ? 'opacity-60 transition' : 'transition'}>
          {/* Filters: Teacher → Academic Year → Trimester */}
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-5">
            <SelectCard
              id="filter-teacher"
              label="Teacher"
              value={teacherId}
              onChange={(e) => {
                setTeacherId(e.target.value)
                load(e.target.value)
              }}
              widthClass="sm:min-w-[16rem]"
            >
              <option value="">All Teachers</option>
              {teachers.map((t) => (
                <option key={t.teacher_id} value={t.teacher_id}>
                  Prof. {t.first_name} {t.last_name}
                </option>
              ))}
            </SelectCard>

            {!view.empty && (
              <PeriodFilter
                trimesters={periods}
                value={view.selected.trimester_id}
                onChange={setTrimesterId}
              />
            )}
          </div>

          {view.empty ? (
            <p className="rounded-lg border border-blue-100 bg-white px-4 py-3 text-sm text-gray-600">
              There are no evaluations to analyze yet.
            </p>
          ) : (
            <>
              {/* Overall + trend + takeaway */}
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                      <Star className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">
                        {teacherId ? 'Overall Rating' : 'Overall Faculty Rating'}
                      </p>
                      <p className="text-3xl font-bold text-[#0c2a5e]">
                        {view.selected.average.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">out of 5.00</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <LevelBadge level={levelOf(view.selected.average)} />
                    {view.previous ? (
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <Delta value={view.overallChange} /> vs {view.previous.short}
                      </span>
                    ) : (
                      <span className="text-gray-400">No previous trimester to compare</span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Based on {view.selected.total_evaluations} evaluation
                    {view.selected.total_evaluations === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#0c2a5e]">Performance Trend</p>
                    {view.totalChange != null && (
                      <span className="text-xs">
                        <Delta value={view.totalChange} /> overall
                      </span>
                    )}
                  </div>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={view.trend} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v) => (v == null ? 'No data' : v.toFixed(2))} />
                        <Line type="monotone" dataKey="average" name="Average" stroke="#0c2a5e" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#0c2a5e]">
                    <Lightbulb className="h-4 w-4" /> Key Takeaway
                  </p>
                  <p className="text-sm leading-relaxed text-gray-700">
                    The overall {teacherId ? 'rating' : 'faculty rating'} for {view.selected.label} is{' '}
                    <strong>{view.selected.average.toFixed(2)}</strong> out of 5.00 (
                    {levelOf(view.selected.average)}).
                    {view.overallChange != null && (
                      <>
                        {' '}
                        This {view.overallChange > 0 ? 'improved' : view.overallChange < 0 ? 'declined' : 'did not change'}
                        {view.overallChange !== 0 && <> by {Math.abs(view.overallChange).toFixed(2)}</>} compared
                        with {view.previous.short}.
                      </>
                    )}
                    {hasSpread && (
                      <>
                        {' '}
                        <strong>{highestNames.join(', ')}</strong>{' '}
                        {highestNames.length > 1 ? 'are the highest rated categories' : 'is the highest rated category'} (
                        {highest.current.toFixed(2)}), while <strong>{lowestNames.join(', ')}</strong> (
                        {lowest.current.toFixed(2)}) {lowestNames.length > 1 ? 'are' : 'is'} the lowest rated.
                      </>
                    )}
                    {allTied && (
                      <>
                        {' '}
                        All rated categories share the same rating ({highest.current.toFixed(2)}).
                      </>
                    )}
                    {view.mostImproved && (
                      <>
                        {' '}
                        <strong>{view.mostImproved.name}</strong> showed the largest improvement (+
                        {view.mostImproved.change.toFixed(2)}).
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Category insights chart */}
              <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-[#0c2a5e]">Category Insights</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={view.chartData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="name" interval={0} tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                      <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => (v == null ? 'No data' : v.toFixed(2))} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {view.previous && (
                        <Bar dataKey="previous" name={view.previous.short} fill="#93c5fd" radius={[3, 3, 0, 0]} />
                      )}
                      <Bar dataKey="current" name={view.selected.short} fill="#0c2a5e" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Strengths + areas for improvement */}
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Strengths
                  </p>
                  {view.strengths.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      {view.rated.length === 0
                        ? 'There are not enough rated categories to identify strengths.'
                        : 'No categories are rated Very Good or higher this period.'}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {view.strengths.map((s) => (
                        <li key={s.category_id} className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-[#0c2a5e]">{s.name}</span>
                            <span className="text-sm font-bold text-emerald-700">{s.current.toFixed(2)}</span>
                          </div>
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                            <LevelBadge level={s.level} />
                            {hasSpread && s.current === highest.current && <span>Highest rated category</span>}
                            {s.change != null && (
                              <span className="inline-flex items-center gap-1">
                                <Delta value={s.change} /> vs {view.previous.short}
                              </span>
                            )}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-700">
                    <AlertTriangle className="h-4 w-4" /> Areas for Improvement
                  </p>
                  {view.improve.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      {view.rated.length === 0
                        ? 'There are not enough rated categories to identify areas for improvement.'
                        : 'No categories fall below Very Good this period.'}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {view.improve.map((s) => (
                        <li key={s.category_id} className="rounded-lg border border-red-100 bg-red-50/50 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-[#0c2a5e]">{s.name}</span>
                            <span className="text-sm font-bold text-red-700">{s.current.toFixed(2)}</span>
                          </div>
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                            <LevelBadge level={s.level} />
                            <span>{improvementNote(s.level)}</span>
                            {s.change != null && (
                              <span className="inline-flex items-center gap-1">
                                <Delta value={s.change} /> vs {view.previous.short}
                              </span>
                            )}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Comparison table */}
              <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#0c2a5e]">Category Performance Comparison</p>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/category-breakdown')}
                    className="flex items-center gap-1 text-xs font-medium text-[#0c2a5e] hover:underline"
                  >
                    View Details <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                        <th className="py-2 pr-3 font-medium">Category</th>
                        {view.previous && (
                          <th className="whitespace-nowrap py-2 pr-3 font-medium">{view.previous.short}</th>
                        )}
                        <th className="whitespace-nowrap py-2 pr-3 font-medium">{view.selected.short}</th>
                        <th className="py-2 font-medium">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {view.rows.map((r) => (
                        <tr key={r.category_id} className="border-b border-gray-100">
                          <td className="py-3 pr-3 font-medium text-[#0c2a5e]">{r.name}</td>
                          {view.previous && (
                            <td className="py-3 pr-3">{r.prev != null ? r.prev.toFixed(2) : '—'}</td>
                          )}
                          <td className="py-3 pr-3 font-semibold text-[#0c2a5e]">
                            {r.current != null ? r.current.toFixed(2) : '—'}
                          </td>
                          <td className="py-3">
                            <Delta value={r.change} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}