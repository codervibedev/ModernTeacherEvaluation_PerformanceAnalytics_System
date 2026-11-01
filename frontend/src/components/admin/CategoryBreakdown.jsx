import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { LayoutGrid, Search, Download, Trophy, TrendingDown } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import PeriodFilter from './PeriodFilter'

const PAGE_SIZE = 10
const PALETTE = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6']

const LEVEL_TEXT = {
  Excellent: 'text-emerald-700',
  'Very Good': 'text-blue-700',
  Good: 'text-amber-700',
  'Needs Improvement': 'text-orange-700',
  Poor: 'text-red-700',
}

// Parehong scale ng backend
function levelOf(avg) {
  if (avg == null) return null
  if (avg >= 4.5) return 'Excellent'
  if (avg >= 3.5) return 'Very Good'
  if (avg >= 2.5) return 'Good'
  if (avg >= 1.5) return 'Needs Improvement'
  return 'Poor'
}

// Iwas CSV injection: ang cell na nagsisimula sa = + - @ ay nilalagyan ng '
const csvCell = (value) => {
  let s = String(value ?? '')
  if (/^[=+\-@]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

function exportCsv(data, rows) {
  const header = [
    'Rank',
    'Teacher',
    ...data.categories.map((c) => c.name),
    'Overall Average',
    'Total Evaluations',
  ]
  const lines = [
    header,
    ...rows.map((t) => [
      t.rank,
      t.name,
      ...t.scores.map((s) => (s == null ? '' : s.toFixed(2))),
      t.overall.toFixed(2),
      t.total_evaluations,
    ]),
  ].map((cols) => cols.map(csvCell).join(','))

  const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `category-breakdown-${data.trimester.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function CategoryBreakdown() {
  const navigate = useNavigate()
  const [trimesters, setTrimesters] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(
    async (trimesterId) => {
      setLoading(true)
      try {
        const res = await axios.get('/api/admin/analytics/category-breakdown', {
          params: trimesterId ? { trimester_id: trimesterId } : {},
        })
        setData(res.data)
        setError('')
        setPage(1)
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/admin/login', { replace: true })
        } else {
          setError('Unable to load the category breakdown. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    },
    [navigate]
  )

  useEffect(() => {
    load()
    axios
      .get('/api/admin/trimesters')
      .then((res) => setTrimesters(res.data))
      .catch(() => {})
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data?.teachers ?? []).filter((t) => !q || t.name.toLowerCase().includes(q))
  }, [data, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const visible = filtered.slice(start, start + PAGE_SIZE)

  const colors = data
    ? Object.fromEntries(data.categories.map((c, i) => [c.category_id, PALETTE[i % PALETTE.length]]))
    : {}
  const rated = data ? data.categories.filter((c) => c.average != null) : []
  const empty = !data || rated.length === 0

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-100 bg-white">
          <LayoutGrid className="h-5 w-5 text-[#0c2a5e]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight text-[#0c2a5e]">Category Breakdown</h1>
          <p className="text-sm text-gray-600">
            View detailed performance breakdown of faculty members across all evaluation categories.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading && !data && <p className="text-sm text-gray-500">Loading category breakdown...</p>}

      {data && (
        <div className={loading ? 'opacity-60 transition' : 'transition'}>
          {/* Filter: Academic Year → Trimester */}
          <div className="mb-5">
            <PeriodFilter
              trimesters={trimesters}
              value={data.trimester.trimester_id}
              onChange={load}
            />
          </div>

          {empty && (
            <p className="mb-4 rounded-lg border border-blue-100 bg-white px-4 py-3 text-sm text-gray-600">
              There are no evaluations for this trimester yet.
            </p>
          )}

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Category average scores */}
            <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-[#0c2a5e]">Category Average Scores</p>
              {empty ? (
                <p className="py-10 text-center text-sm text-gray-500">No data yet.</p>
              ) : (
                <>
                  <div className="relative mx-auto h-44 w-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={rated}
                          dataKey="average"
                          nameKey="name"
                          innerRadius={52}
                          outerRadius={80}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {rated.map((c) => (
                            <Cell key={c.category_id} fill={colors[c.category_id]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => v.toFixed(2)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-[#0c2a5e]">
                        {data.overall != null ? data.overall.toFixed(2) : 'N/A'}
                      </span>
                      <span className="text-[10px] text-gray-500">Overall Average</span>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-1.5 text-xs">
                    {data.categories.map((c) => (
                      <li key={c.category_id} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[c.category_id] }} />
                        <span className="flex-1 text-gray-700">{c.name}</span>
                        <span className="font-semibold text-[#0c2a5e]">
                          {c.average != null ? c.average.toFixed(2) : 'N/A'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Category comparison */}
            <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-[#0c2a5e]">Category Comparison</p>
              {empty ? (
                <p className="py-10 text-center text-sm text-gray-500">No data yet.</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rated} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                      <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => v.toFixed(2)} />
                      <Bar dataKey="average" name="Average" radius={[0, 4, 4, 0]}>
                        {rated.map((c) => (
                          <Cell key={c.category_id} fill={colors[c.category_id]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Highest and lowest category */}
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Top Performing Category</p>
                    <p className="text-lg font-bold text-[#0c2a5e]">{data.top ? data.top.name : 'N/A'}</p>
                    {data.top && (
                      <p className="text-xs text-gray-500">
                        Highest average: {data.top.average.toFixed(2)} / 5.00
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Lowest Rated Category</p>
                    <p className="text-lg font-bold text-[#0c2a5e]">{data.lowest ? data.lowest.name : 'N/A'}</p>
                    {data.lowest && (
                      <p className="text-xs text-gray-500">
                        Lowest average: {data.lowest.average.toFixed(2)} / 5.00
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details table */}
          <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <p className="mr-auto text-sm font-semibold text-[#0c2a5e]">Category Breakdown Details</p>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Search by name..."
                  aria-label="Search by name"
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 sm:w-56"
                />
              </div>

              <button
                type="button"
                onClick={() => exportCsv(data, filtered)}
                disabled={filtered.length === 0}
                className="flex items-center gap-2 rounded-lg border border-[#0c2a5e] px-3 py-2 text-sm text-[#0c2a5e] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-4 w-4" /> Export
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="py-2 pr-3 font-medium">#</th>
                    <th className="py-2 pr-3 font-medium">Teacher</th>
                    {data.categories.map((c) => (
                      <th key={c.category_id} className="min-w-[96px] py-2 pr-3 font-medium">
                        {c.name}
                      </th>
                    ))}
                    <th className="py-2 font-medium">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={data.categories.length + 3} className="py-8 text-center text-gray-500">
                        {data.teachers.length === 0
                          ? 'There are no evaluations for this trimester yet.'
                          : 'No teachers match your search.'}
                      </td>
                    </tr>
                  )}
                  {visible.map((t) => (
                    <tr key={t.teacher_id} className="border-b border-gray-100">
                      <td className="py-3 pr-3 text-gray-500">{t.rank}</td>
                      <td className="whitespace-nowrap py-3 pr-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/teacher-profile?teacher_id=${t.teacher_id}`)}
                          className="font-medium text-[#0c2a5e] hover:underline"
                        >
                          Prof. {t.name}
                        </button>
                      </td>
                      {t.scores.map((s, i) => (
                        <td
                          key={data.categories[i].category_id}
                          className={`py-3 pr-3 font-semibold ${LEVEL_TEXT[levelOf(s)] || 'text-gray-400'}`}
                        >
                          {s != null ? s.toFixed(2) : '—'}
                        </td>
                      ))}
                      <td className="py-3 font-bold text-[#0c2a5e]">{t.overall.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>
                Showing {filtered.length === 0 ? 0 : start + 1}-{start + visible.length} of{' '}
                {filtered.length} teachers
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="rounded-md border border-gray-300 px-2.5 py-1 disabled:opacity-40"
                >
                  Prev
                </button>
                <span>
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="rounded-md border border-gray-300 px-2.5 py-1 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}