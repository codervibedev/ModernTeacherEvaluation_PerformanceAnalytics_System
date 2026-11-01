import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Trophy, Users, Star, TrendingUp, TrendingDown, Search, Download, Eye } from 'lucide-react'

const PAGE_SIZE = 10

const LEVEL_STYLES = {
  Excellent: 'bg-emerald-50 text-emerald-700',
  'Very Good': 'bg-blue-50 text-blue-700',
  Good: 'bg-amber-50 text-amber-700',
  'Needs Improvement': 'bg-orange-50 text-orange-700',
  Poor: 'bg-red-50 text-red-700',
}

const RANK_STYLES = {
  1: 'bg-amber-100 text-amber-700',
  2: 'bg-slate-200 text-slate-700',
  3: 'bg-orange-100 text-orange-700',
}

const TONES = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-violet-50 text-violet-600',
}

function SummaryCard({ icon: Icon, tone, label, value, note }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${TONES[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="truncate text-xl font-bold text-[#0c2a5e]">{value}</p>
          {note && <p className="truncate text-xs text-gray-500">{note}</p>}
        </div>
      </div>
    </div>
  )
}

// Iwas CSV injection: ang cell na nagsisimula sa = + - @ ay nilalagyan ng '
const csvCell = (value) => {
  let s = String(value ?? '')
  if (/^[=+\-@]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

function exportCsv(rows, label) {
  const header = ['Rank', 'Teacher', 'Overall Rating', 'Performance Level', 'Total Evaluations']
  const lines = [
    header,
    ...rows.map((r) => [r.rank, r.name, r.average.toFixed(2), r.level, r.total_evaluations]),
  ].map((cols) => cols.map(csvCell).join(','))

  const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-ranking-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function PerformanceRanking() {
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
        const res = await axios.get('/api/admin/analytics/ranking', {
          params: trimesterId ? { trimester_id: trimesterId } : {},
        })
        setData(res.data)
        setError('')
        setPage(1)
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/admin/login', { replace: true })
        } else {
          setError('Unable to load the ranking. Please try again.')
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
  const summary = data?.summary

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-100 bg-white">
          <Trophy className="h-5 w-5 text-[#0c2a5e]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight text-[#0c2a5e]">Performance Ranking</h1>
          <p className="text-sm text-gray-600">
            View the overall performance ranking of faculty members based on evaluation results.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading && !data && <p className="text-sm text-gray-500">Loading ranking...</p>}

      {data && (
        <div className={loading ? 'opacity-60 transition' : 'transition'}>
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={Users}
              tone="blue"
              label="Total Faculty"
              value={summary.total_faculty}
              note={`${summary.ranked_count} ranked`}
            />
            <SummaryCard
              icon={TrendingUp}
              tone="green"
              label="Highest Rating"
              value={summary.highest ? summary.highest.rating.toFixed(2) : 'N/A'}
              note={summary.highest ? `Prof. ${summary.highest.name}` : 'No evaluations yet'}
            />
            <SummaryCard
              icon={TrendingDown}
              tone="red"
              label="Lowest Rating"
              value={summary.lowest ? summary.lowest.rating.toFixed(2) : 'N/A'}
              note={summary.lowest ? `Prof. ${summary.lowest.name}` : 'No evaluations yet'}
            />
            <SummaryCard
              icon={Star}
              tone="purple"
              label="Average Rating"
              value={summary.average != null ? summary.average.toFixed(2) : 'N/A'}
              note="All faculty"
            />
          </div>

          {/* Ranking table */}
          <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <p className="mr-auto text-sm font-semibold text-[#0c2a5e]">Faculty Performance Ranking</p>

              <select
                value={data.trimester.trimester_id}
                onChange={(e) => load(e.target.value)}
                aria-label="Select trimester"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {trimesters.map((t) => (
                  <option key={t.trimester_id} value={t.trimester_id}>
                    {t.label}
                    {t.is_current ? ' - Current' : ''}
                  </option>
                ))}
              </select>

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
                onClick={() => exportCsv(filtered, data.trimester.label)}
                disabled={filtered.length === 0}
                className="flex items-center gap-2 rounded-lg border border-[#0c2a5e] px-3 py-2 text-sm text-[#0c2a5e] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-4 w-4" /> Export
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-2 pr-3 font-medium">Rank</th>
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">Overall Rating</th>
                    <th className="py-2 pr-3 font-medium">Performance Level</th>
                    <th className="py-2 pr-3 font-medium">Total Evaluations</th>
                    <th className="py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        {data.teachers.length === 0
                          ? 'There are no evaluations for this trimester yet.'
                          : 'No teachers match your search.'}
                      </td>
                    </tr>
                  )}
                  {visible.map((t) => (
                    <tr key={t.teacher_id} className="border-b border-gray-100">
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            RANK_STYLES[t.rank] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {t.rank}
                        </span>
                      </td>
                      <td className="py-3 pr-3 font-medium text-[#0c2a5e]">
                        Prof. {t.name}
                        {!t.is_active && (
                          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-normal text-gray-500">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-[#0c2a5e]">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {t.average.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${LEVEL_STYLES[t.level]}`}>
                          {t.level}
                        </span>
                      </td>
                      <td className="py-3 pr-3">{t.total_evaluations}</td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/teacher-profile?teacher_id=${t.teacher_id}`)}
                          className="flex items-center gap-1.5 rounded-md bg-[#0c2a5e] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#0a2249]"
                        >
                          <Eye className="h-3.5 w-3.5" /> View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.unrated > 0 && (
              <p className="mt-3 text-xs text-gray-500">
                {data.unrated} active {data.unrated === 1 ? 'teacher has' : 'teachers have'} no
                evaluations in this trimester and {data.unrated === 1 ? 'is' : 'are'} not ranked.
              </p>
            )}

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