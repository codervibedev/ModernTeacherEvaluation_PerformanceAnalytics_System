import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Users, FileText, Star, Trophy, TrendingUp, TrendingDown } from 'lucide-react'
import {
  CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useAdminAuth } from './AdminAuth'
import TypingGreeting from './TypingGreeting'
import PeriodFilter from './PeriodFilter'

const LEVEL_COLORS = {
  Excellent: '#10b981',
  'Very Good': '#3b82f6',
  Good: '#f59e0b',
  'Needs Improvement': '#f97316',
  Poor: '#ef4444',
}

const TONES = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  purple: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600',
}

function StatCard({ icon: Icon, tone, label, value, children }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${TONES[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="truncate text-xl font-bold text-[#0c2a5e]">{value}</p>
        </div>
      </div>
      {children && <div className="mt-3 text-xs">{children}</div>}
    </div>
  )
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

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { admin } = useAdminAuth()
  const [trimesters, setTrimesters] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(
    async (trimesterId) => {
      setLoading(true)
      try {
        const res = await axios.get('/api/admin/analytics/dashboard', {
          params: trimesterId ? { trimester_id: trimesterId } : {},
        })
        setData(res.data)
        setError('')
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/admin/login', { replace: true })
        } else {
          setError('Unable to load the dashboard. Please try again.')
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

  const stats = data?.stats
  const empty = !stats || stats.total_evaluations === 0
  const evaluatedPercent =
    stats && stats.total_teachers > 0
      ? Math.round((stats.teachers_evaluated / stats.total_teachers) * 100)
      : 0

  return (
    <div>
      {/* Heading + single period toolbar */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <TypingGreeting name={admin?.name} />
          <p className="text-sm text-gray-600">
            Here's an overview of the teacher evaluation system.
          </p>
        </div>

        <div className="w-full md:w-auto">
          <PeriodFilter
            trimesters={trimesters}
            value={data?.trimester.trimester_id ?? ''}
            onChange={load}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading && !data && <p className="text-sm text-gray-500">Loading dashboard...</p>}

      {data && (
        <div className={loading ? 'opacity-60 transition' : 'transition'}>
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Users}
              tone="blue"
              label="Teachers Evaluated"
              value={`${stats.teachers_evaluated} / ${stats.total_teachers}`}
            >
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${evaluatedPercent}%` }} />
              </div>
              <p className="mt-1 text-gray-500">{evaluatedPercent}% of active teachers</p>
            </StatCard>

            <StatCard icon={FileText} tone="green" label="Total Evaluations" value={stats.total_evaluations}>
              <span className="text-gray-500">Submitted this trimester</span>
            </StatCard>

            <StatCard
              icon={Star}
              tone="purple"
              label="Average Faculty Rating"
              value={stats.average_rating != null ? `${stats.average_rating.toFixed(2)} / 5.00` : 'N/A'}
            >
              <Change value={stats.change} />
            </StatCard>

            <StatCard
              icon={Trophy}
              tone="amber"
              label="Top Performing Teacher"
              value={stats.top_teacher ? `Prof. ${stats.top_teacher.name}` : 'N/A'}
            >
              {stats.top_teacher && (
                <span className="text-gray-500">Rating: {stats.top_teacher.rating.toFixed(2)} / 5.00</span>
              )}
            </StatCard>
          </div>

          {empty && (
            <p className="mt-4 rounded-lg border border-blue-100 bg-white px-4 py-3 text-sm text-gray-600">
              There are no evaluations for this trimester yet.
            </p>
          )}

          {/* Charts */}
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm lg:col-span-2">
              <p className="mb-3 text-sm font-semibold text-[#0c2a5e]">Faculty Performance Overview</p>
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
            </div>

            <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-[#0c2a5e]">Evaluation Distribution</p>
              {empty ? (
                <p className="py-10 text-center text-sm text-gray-500">No data yet.</p>
              ) : (
                <>
                  <div className="relative mx-auto h-44 w-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.distribution.filter((d) => d.value > 0)}
                          dataKey="value"
                          nameKey="label"
                          innerRadius={52}
                          outerRadius={80}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {data.distribution
                            .filter((d) => d.value > 0)
                            .map((d) => (
                              <Cell key={d.label} fill={LEVEL_COLORS[d.label]} />
                            ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-[#0c2a5e]">{stats.total_evaluations}</span>
                      <span className="text-[10px] text-gray-500">Total Evaluations</span>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-1.5 text-xs">
                    {data.distribution.map((d) => (
                      <li key={d.label} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: LEVEL_COLORS[d.label] }} />
                        <span className="flex-1 text-gray-700">
                          {d.label} ({d.value})
                        </span>
                        <span className="font-semibold text-[#0c2a5e]">{d.percent}%</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* Recent evaluations */}
          <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-[#0c2a5e]">Recent Evaluations</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium">Teacher</th>
                    <th className="py-2 font-medium">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-5 text-center text-gray-500">
                        No evaluations yet.
                      </td>
                    </tr>
                  )}
                  {data.recent.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-3 pr-3 whitespace-nowrap">
                        {new Date(r.date).toLocaleDateString('en-PH', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 pr-3">Prof. {r.teacher}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-[#0c2a5e]">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {r.rating.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}