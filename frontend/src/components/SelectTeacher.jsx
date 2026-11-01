import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { User, Search, X, ArrowRight } from 'lucide-react'
import EvaluationLayout from './EvaluationLayout'
import { useEvaluation } from './EvaluationContext'

export default function SelectTeacher() {
  const navigate = useNavigate()
  const { setTeacher, resetEvaluation } = useEvaluation()
  const [teachers, setTeachers] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    resetEvaluation()
    axios
      .get('/api/student/teachers')
      .then((res) => setTeachers(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          navigate('/evaluation/student-info', { replace: true })
        } else {
          setError(err.response?.data?.error || 'Unable to load teachers.')
        }
      })
      .finally(() => setLoading(false))
  }, [navigate, resetEvaluation])

  const q = query.trim().toLowerCase()
  const filtered = teachers.filter((t) => t.name.toLowerCase().includes(q))

  const handleSelect = (t) => {
    setTeacher(t)
    navigate('/evaluation/choose-category')
  }

  return (
    <EvaluationLayout step={2}>
      <div className="w-full rounded-xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        {/* Title */}
        <div className="mb-5 flex items-center gap-3 sm:mb-6 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 sm:h-12 sm:w-12">
            <User className="h-5 w-5 text-[#0c2a5e] sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] tracking-widest text-gray-500">TEACHER SELECTION</p>
            <h1 className="text-xl font-bold leading-tight text-[#0c2a5e] sm:text-2xl">
              Select Teacher
            </h1>
            <p className="text-xs text-gray-500 sm:text-sm">
              Choose the teacher you want to evaluate. You can search by name.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teacher by name..."
            aria-label="Search teacher by name"
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-9 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 sm:text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Teacher list */}
        <div className="rounded-lg border border-gray-200">
          <p className="border-b border-gray-200 px-3 py-3 text-sm font-semibold text-[#0c2a5e] sm:px-4">
            Available Teachers{' '}
            <span className="ml-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-[#0c2a5e]">
              {filtered.length}
            </span>
          </p>

          {loading && <p className="px-4 py-6 text-sm text-gray-500">Loading teachers...</p>}
          {error && (
            <p role="alert" className="px-4 py-6 text-sm text-red-600">
              {error}
            </p>
          )}
          {!loading && !error && filtered.length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-500">No teachers found.</p>
          )}

          <ul className="divide-y divide-gray-100">
            {filtered.map((t) => (
              <li key={t.teacher_id} className="flex items-center gap-3 px-3 py-3 sm:px-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <User className="h-4 w-4 text-[#0c2a5e]" />
                </div>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[#0c2a5e]">
                  Prof. {t.name}
                </p>
                {t.already_evaluated ? (
                  <span className="shrink-0 rounded-md bg-gray-100 px-3 py-1.5 text-xs text-gray-500">
                    Already evaluated
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSelect(t)}
                    className="flex shrink-0 items-center gap-1 rounded-md bg-[#0c2a5e] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#0a2249]"
                  >
                    Select <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </EvaluationLayout>
  )
}