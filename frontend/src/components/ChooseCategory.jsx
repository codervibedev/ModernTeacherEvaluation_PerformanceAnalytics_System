import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  MessageCircle,
  Users,
  ShieldCheck,
  UserCheck,
  FileText,
  ClipboardList,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  User,
  Info,
} from 'lucide-react'

import EvaluationLayout from './EvaluationLayout'
import { useEvaluation } from './EvaluationContext'

const ICONS = {
  'Teaching Effectiveness': GraduationCap,
  Communication: MessageCircle,
  'Classroom Management': Users,
  Professionalism: ShieldCheck,
  'Student Engagement': UserCheck,
  'Assessment & Feedback': FileText,
}

export default function ChooseCategory() {
  const navigate = useNavigate()
  const { teacher, categories, isCategoryDone } = useEvaluation()

  useEffect(() => {
    if (!teacher) {
      navigate('/evaluation/select-teacher', { replace: true })
    }
  }, [teacher, navigate])

  if (!teacher) return null

  const doneCount = categories.filter(isCategoryDone).length
  const allDone = categories.length > 0 && doneCount === categories.length
  const percent = categories.length > 0 ? (doneCount / categories.length) * 100 : 0

  return (
    <EvaluationLayout step={3}>
      <div className="w-full rounded-xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        {/* Title */}
        <div className="mb-5 flex items-start gap-3 sm:mb-6 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 sm:h-12 sm:w-12">
            <User className="h-5 w-5 text-[#0c2a5e] sm:h-6 sm:w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] tracking-widest text-gray-500">TEACHER EVALUATION</p>
            <h1 className="text-xl font-bold leading-tight text-[#0c2a5e] sm:text-2xl">
              Choose Category
            </h1>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Choose any category you want to evaluate. Completed categories will remain
              visible but cannot be selected again.
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
          <span>
            Evaluating: <strong className="text-[#0c2a5e]">Prof. {teacher.name}</strong>
          </span>
          <span>
            {doneCount} of {categories.length} categories completed
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={categories.length}
          aria-valuenow={doneCount}
          aria-label="Completed categories"
          className="mb-5 h-2 overflow-hidden rounded-full bg-gray-100"
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Category list */}
        <div className="rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#0c2a5e]">Evaluation Categories</p>

            {allDone && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                All completed
              </span>
            )}
          </div>

          {categories.length === 0 ? (
            <p className="text-sm text-gray-500">Loading categories...</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const Icon = ICONS[category.category_name] || ClipboardList
                const done = isCategoryDone(category)

                return (
                  <button
                    key={category.category_id}
                    type="button"
                    disabled={done}
                    onClick={() => navigate(`/evaluation/rate/${category.category_id}`)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition sm:p-4 ${
                      done
                        ? 'cursor-not-allowed border-emerald-200 bg-emerald-50 opacity-80'
                        : 'border-gray-200 bg-white hover:border-[#0c2a5e] hover:bg-blue-50 hover:shadow-sm'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        done ? 'bg-emerald-100' : 'bg-blue-50'
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${done ? 'text-emerald-700' : 'text-[#0c2a5e]'}`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          done ? 'text-emerald-800' : 'text-[#0c2a5e]'
                        }`}
                      >
                        {category.category_name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">{category.description}</p>
                      {done && (
                        <p className="mt-2 text-xs font-medium text-emerald-700">Completed</p>
                      )}
                    </div>

                    {done ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Reminder */}
        <div className="mt-4 flex gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 sm:p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0c2a5e]" />

          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0c2a5e]">Important Reminder</p>

            <ul className="mt-1 ml-4 list-disc space-y-1 text-xs leading-relaxed text-gray-600 sm:text-sm">
              <li>
                Rate each category honestly and fairly, based on your actual classroom
                experience.
              </li>
              <li>You may complete the categories in any order.</li>
              <li>Completed categories are locked and cannot be selected again.</li>
              <li>
                All categories must be completed before you can review and submit your
                evaluation.
              </li>
            </ul>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate('/evaluation/select-teacher')}
            className="flex w-full items-center justify-center gap-1 rounded-md border border-[#0c2a5e] px-4 py-2.5 text-sm text-[#0c2a5e] transition hover:bg-blue-50 sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {allDone && (
            <button
              type="button"
              onClick={() => navigate('/evaluation/review')}
              className="flex w-full items-center justify-center gap-1 rounded-md bg-[#0c2a5e] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0a2249] sm:w-auto"
            >
              Review &amp; Submit
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </EvaluationLayout>
  )
}