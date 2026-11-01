import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  CalendarRange, Star, TrendingUp, TrendingDown, Trophy, Target, FileText, Sparkles,
} from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

const MAX_SELECTED = 4
const SERIES_COLORS = ['#93c5fd', '#3b82f6', '#0c2a5e', '#10b981']

const round2 = (n) => Math.round(n * 100) / 100

function Delta({ value }) {
  if (value == null) return <span className="text-gray-400">—</span>
  if (value === 0) return <span className="text-gray-500">0.00</span>
  const up = value > 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${up ? 'text-emerald-600' : 'text-red-600'}`}>
      <Icon className="h-3.5 w-3.5" />
      {up ? '+' : ''}
      {value.toFixed(2)}
    </span>
  )
}

function Card({ icon: Icon, tone, label, value, note }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="truncate text-xl font-bold text-[#0c2a5e]">{value}</p>
          {note && <div className="text-xs">{note}</div>}
        </div>
      </div>
    </div>
  )
}

export default function TrimesterComparison() {
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState([])
  const [teacherId, setTeacherId] = useState('')
  const [selectedIds, setSelectedIds] = useState(null) // null = default
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
          setError('Unable to load the trimester comparison. Please try again.')
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
  }, [load])

  const view = useMemo(() => {
    if (!data) return null

    const ids =
      selectedIds ??
      data.trimesters.filter((t) => t.has_data).slice(-MAX_SELECTED + 1).map((t) => t.trimester_id)

    const cols = data.trimesters
      .map((t, index) => ({ t, index }))
      .filter(({ t }) => ids.includes(t.trimester_id))

    const latest = cols[cols.length - 1]?.t
    const previous = cols.length > 1 ? cols[cols.length - 2].t : null

    const rows = data.categories.map((c) => {
      const values = cols.map(({ index }) => c.values[index])
      const last = values[values.length - 1]
      const prev = values.length > 1 ? values[values.length - 2] : null
      return {
        ...c,
        values,
        last,
        change: last != null && prev != null ? round2(last - prev) : null,
      }
    })

    const withLast = rows.filter((r) => r.last != null)
    const top = withLast.length ? withLast.reduce((a, b) => (b.last > a.last ? b : a)) : null
    const focus = withLast.length ? withLast.reduce((a, b) => (b.last < a.last ? b : a)) : null
    const improving = rows.filter((r) => r.change != null && r.change > 0)
    const mostImproved = improving.length
      ? improving.reduce((a, b) => (b.change > a.change ? b : a))
      : null

    const withData = cols.map(({ t }) => t).filter((t) => t.average != null)
    const highest = withData.length ? withData.reduce((a, b) => (b.average > a.average ? b : a)) : null
    const lowest = withData.length ? withData.reduce((a, b) => (b.average < a.average ? b : a)) : null

    const overallChange =
      latest?.average != null && previous?.average != null
        ? round2(latest.average - previous.average)
        : null

    const chartData = rows.map((r) => ({
      name: r.name,
      ...Object.fromEntries(cols.map(({ t }, k) => [`t${t.trimester_id}`, r.values[k]])),
    }))

    return {
      ids, cols, latest, previous, rows, top, focus, mostImproved,
      highest, lowest, overallChange, chartData,
      totalEvaluations: cols.reduce((sum, { t }) => sum + t.total_evaluations, 0),
    }
  }, [data, selectedIds])

  const toggle = (id) => {
    const current = view.ids
    if (current.includes(id)) {
      if (current.length > 1) setSelectedIds(current.filter((x) => x !== id))
    } else if (current.length < MAX_SELECTED) {
      setSelectedIds([...current, id])
    }
  }

  const changeTeacher = (e) => {
    setTeacherId(e.target.value)
    load(e.target.value)
  }

  const noData = !view || view.cols.every(({ t }) => !t.has_data)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-100 bg-white">
          <CalendarRange className="h-5 w-5 text-[#0c2a5e]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight text-[#0c2a5e]">Trimester Comparison</h1>
          <p className="text-sm text-gray-600">
            Compare faculty performance across different trimesters to track progress and identify
            improvement areas.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading && !data && <p className="text-sm text-gray-500">Loading comparison...</p>}

      {view && (
        <div className={loading ? 'opacity-60 transition' : 'transition'}>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <select
              value={teacherId}
              onChange={changeTeacher}
              aria-label="Select teacher"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">All Teachers</option>
              {teachers.map((t) => (
                <option key={t.teacher_id} value={t.teacher_id}>
                  Prof. {t.first_name} {t.last_name}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Trimesters to compare">
              <span className="text-xs text-gray-500">Compare (max {MAX_SELECTED}):</span>
              {data.trimesters.map((t) => {
                const on = view.ids.includes(t.trimester_id)
                const blocked = !on && view.ids.length >= MAX_SELECTED
                return (
                  <button
                    key={t.trimester_id}
                    type="button"
                    aria-pressed={on}
                    disabled={blocked || (!t.has_data && !on)}
                    onClick={() => toggle(t.trimester_id)}
                    title={t.has_data ? t.label : 'No evaluations in this trimester'}
                    className={`rounded-full border px-3 py-1.5 text-xs transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      on
                        ? 'border-[#0c2a5e] bg-[#0c2a5e] text-white'
                        : 'border-blue-200 bg-white text-[#0c2a5e] hover:bg-blue-50'
                    }`}
                  >
                    {t.short}
                  </button>
                )
              })}
            </div>
          </div>

          {noData && (
            <p className="mb-4 rounded-lg border border-blue-100 bg-white px-4 py-3 text-sm text-gray-600">
              There are no evaluations to compare yet.
            </p>
          )}

          {/* Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card
              icon={Star}
              tone="bg-violet-50 text-violet-600"
              label={`Overall Average (${view.latest?.short ?? 'N/A'})`}
              value={view.latest?.average != null ? view.latest.average.toFixed(2) : 'N/A'}
              note={view.previous ? <Delta value={view.overallChange} /> : null}
            />
            <Card
              icon={Trophy}
              tone="bg-emerald-50 text-emerald-600"
              label="Highest Average"
              value={view.highest ? view.highest.average.toFixed(2) : 'N/A'}
              note={view.highest && <span className="text-gray-500">{view.highest.short}</span>}
            />
            <Card
              icon={TrendingDown}
              tone="bg-red-50 text-red-600"
              label="Lowest Average"
              value={view.lowest ? view.lowest.average.toFixed(2) : 'N/A'}
              note={view.lowest && <span className="text-gray-500">{view.lowest.short}</span>}
            />
            <Card
              icon={FileText}
              tone="bg-blue-50 text-blue-600"
              label="Evaluations Compared"
              value={view.totalEvaluations}
              note={<span className="text-gray-500">{view.cols.length} trimester(s)</span>}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {/* Chart */}
            <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm lg:col-span-2">
              <p className="mb-3 text-sm font-semibold text-[#0c2a5e]">Faculty Performance Trend</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={view.chartData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" interval={0} tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                    <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => (v == null ? 'No data' : v.toFixed(2))} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {view.cols.map(({ t }, k) => (
                      <Bar
                        key={t.trimester_id}
                        dataKey={`t${t.trimester_id}`}
                        name={t.short}
                        fill={SERIES_COLORS[k % SERIES_COLORS.length]}
                        radius={[3, 3, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Key insights */}
            <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0c2a5e]">
                <Sparkles className="h-4 w-4" /> Key Insights
              </p>

              {noData ? (
                <p className="text-sm text-gray-500">No data yet.</p>
              ) : (
                <ul className="space-y-4 text-sm">
                  <li>
                    <p className="text-xs text-gray-500">Overall Performance</p>
                    {view.overallChange == null ? (
                      <p className="text-gray-600">
                        Select at least two trimesters with data to see how performance changed.
                      </p>
                    ) : (
                      <p className="text-gray-700">
                        <strong className={view.overallChange > 0 ? 'text-emerald-600' : view.overallChange < 0 ? 'text-red-600' : ''}>
                          {view.overallChange > 0 ? 'Improved' : view.overallChange < 0 ? 'Declined' : 'No change'}
                        </strong>
                        {view.overallChange !== 0 && ` by ${Math.abs(view.overallChange).toFixed(2)}`} compared
                        to {view.previous.short}.
                      </p>
                    )}
                  </li>

                  {view.top && (
                    <li>
                      <p className="text-xs text-gray-500">Top Category ({view.latest.short})</p>
                      <p className="text-gray-700">
                        <strong>{view.top.name}</strong> ({view.top.last.toFixed(2)})
                      </p>
                    </li>
                  )}

                  {view.focus && view.top && view.focus.category_id !== view.top.category_id && (
                    <li>
                      <p className="flex items-center gap-1 text-xs text-gray-500">
                        <Target className="h-3 w-3" /> Area to Focus
                      </p>
                      <p className="text-gray-700">
                        <strong>{view.focus.name}</strong> ({view.focus.last.toFixed(2)})
                      </p>
                    </li>
                  )}

                  {view.mostImproved && (
                    <li>
                      <p className="text-xs text-gray-500">Most Improved Category</p>
                      <p className="text-gray-700">
                        <strong>{view.mostImproved.name}</strong> (+{view.mostImproved.change.toFixed(2)})
                      </p>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* Category comparison table */}
          <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-[#0c2a5e]">Category Comparison</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="py-2 pr-3 font-medium">Category</th>
                    {view.cols.map(({ t }) => (
                      <th key={t.trimester_id} className="whitespace-nowrap py-2 pr-3 font-medium">
                        {t.short}
                      </th>
                    ))}
                    <th className="whitespace-nowrap py-2 font-medium">
                      Change{view.previous ? ` vs ${view.previous.short}` : ''}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {view.rows.map((r) => (
                    <tr key={r.category_id} className="border-b border-gray-100">
                      <td className="py-3 pr-3 font-medium text-[#0c2a5e]">{r.name}</td>
                      {r.values.map((v, k) => (
                        <td key={view.cols[k].t.trimester_id} className="py-3 pr-3">
                          {v != null ? v.toFixed(2) : '—'}
                        </td>
                      ))}
                      <td className="py-3">
                        <Delta value={r.change} />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50/50 font-semibold text-[#0c2a5e]">
                    <td className="py-3 pr-3">Overall</td>
                    {view.cols.map(({ t }) => (
                      <td key={t.trimester_id} className="py-3 pr-3">
                        {t.average != null ? t.average.toFixed(2) : '—'}
                      </td>
                    ))}
                    <td className="py-3">
                      <Delta value={view.overallChange} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}