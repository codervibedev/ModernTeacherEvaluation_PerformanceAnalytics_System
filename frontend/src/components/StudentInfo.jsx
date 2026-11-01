import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { User, Users, ArrowRight, Info } from 'lucide-react'
import EvaluationLayout from './EvaluationLayout'
import { useEvaluation } from './EvaluationContext'

export default function StudentInfo() {
  const navigate = useNavigate()
  const { setStudent } = useEvaluation()
  const [studentId, setStudentId] = useState('')
  const [section, setSection] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!studentId.trim() || !section.trim()) {
      setError('Please enter your Student ID and Section.')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post('/api/student/verify', {
        student_id: studentId.trim(),
        section: section.trim(),
      })
      setStudent(res.data)
      navigate('/evaluation/select-teacher')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <EvaluationLayout step={1}>
      <div className="w-full rounded-xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        {/* Title */}
        <div className="mb-5 flex items-center gap-3 sm:mb-6 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 sm:h-12 sm:w-12">
            <User className="h-5 w-5 text-[#0c2a5e] sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] tracking-widest text-gray-500">STUDENT EVALUATION SYSTEM</p>
            <h1 className="text-xl font-bold leading-tight text-[#0c2a5e] sm:text-2xl">
              Student Information
            </h1>
            <p className="text-xs text-gray-500 sm:text-sm">
              Please enter your Student ID and Section to proceed with the evaluation.
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 sm:p-4"
        >
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="student-id" className="mb-1 block text-sm font-medium text-[#0c2a5e]">
                Student ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="student-id"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  autoComplete="off"
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="section" className="mb-1 block text-sm font-medium text-[#0c2a5e]">
                Section <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="section"
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  autoComplete="off"
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-w-32 items-center justify-center gap-2 rounded-lg bg-[#0c2a5e] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0a2249] focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Verifying...' : 'Continue'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>

        </form>

        {/* Reminder (sa Step 1 lang) */}
        <div className="mt-4 flex gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 sm:p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0c2a5e]" />
          <div>
            <p className="text-sm font-semibold text-[#0c2a5e]">Important Reminder</p>
            <ul className="mt-1 ml-4 list-disc space-y-0.5 text-xs text-gray-600">
              <li>Each student can only submit one evaluation per teacher.</li>
              <li>Make sure to enter your correct Student ID and Section.</li>
            </ul>
          </div>
        </div>
      </div>
    </EvaluationLayout>
  )
}