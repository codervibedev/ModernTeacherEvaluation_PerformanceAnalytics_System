import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Users, Info, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'

import EvaluationLayout from './EvaluationLayout'
import { useEvaluation } from './EvaluationContext'

export default function RateAspects() {
  const { categoryId } = useParams()
  const navigate = useNavigate()

  const { teacher, categories, ratings, setRating, isCategoryDone } = useEvaluation()

  const category = categories.find(
    (item) => String(item.category_id) === String(categoryId)
  )

  useEffect(() => {
    if (!teacher) {
      navigate('/evaluation/select-teacher', { replace: true })
    }
  }, [teacher, navigate])

  if (!teacher) return null

  if (categories.length === 0) {
    return (
      <EvaluationLayout step={4}>
        <div className="w-full rounded-xl border border-blue-100 bg-white p-4 text-sm text-gray-600 sm:p-6">
          Loading evaluation categories...
        </div>
      </EvaluationLayout>
    )
  }

  if (!category) {
    return (
      <EvaluationLayout step={4}>
        <div className="w-full rounded-xl border border-blue-100 bg-white p-4 sm:p-6">
          <p className="text-sm text-red-600">
            Category not found. Please return to the category selection page.
          </p>

          <button
            type="button"
            onClick={() => navigate('/evaluation/choose-category')}
            className="mt-4 rounded-md bg-[#0c2a5e] px-4 py-2.5 text-sm text-white"
          >
            Back to Categories
          </button>
        </div>
      </EvaluationLayout>
    )
  }

  const aspects = category.aspects || []
  const complete = isCategoryDone(category)
  const allCategoriesDone =
    categories.length > 0 && categories.every((item) => isCategoryDone(item))

  function handleNext() {
    if (!complete || aspects.length === 0) return

    if (allCategoriesDone) {
      navigate('/evaluation/review')
    } else {
      navigate('/evaluation/choose-category')
    }
  }

  return (
    <EvaluationLayout step={4}>
      <div className="w-full rounded-xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        {/* Category header */}
        <div className="mb-5 flex items-start gap-3 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 sm:h-12 sm:w-12">
            <Users className="h-5 w-5 text-[#0c2a5e] sm:h-6 sm:w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] tracking-widest text-blue-600">RATE THE ASPECTS</p>

            <h1 className="text-xl font-bold leading-tight text-[#0c2a5e] sm:text-2xl">
              {category.category_name}
            </h1>

            <p className="mt-1 text-xs text-gray-500 sm:text-sm">{category.description}</p>

            <p className="mt-2 text-xs text-gray-600">
              Evaluating: <strong className="text-[#0c2a5e]">Prof. {teacher.name}</strong>
            </p>
          </div>
        </div>

        {/* Rating instructions */}
        <div className="mb-4 flex gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
          <Info className="h-5 w-5 shrink-0 text-[#0c2a5e]" />

          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#0c2a5e] sm:text-sm">
              Please rate each aspect below.
            </p>
            <p className="mt-1 text-xs text-gray-600 sm:text-sm">
              Use the scale from 1 (Poor) to 5 (Excellent).
            </p>
          </div>
        </div>

        {/* Aspects and ratings */}
        {aspects.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No aspects are available for this category. Please contact the administrator.
          </div>
        ) : (
          <div className="space-y-3">
            {aspects.map((aspect) => (
              <div
                key={aspect.aspect_id}
                className="flex flex-col gap-3 rounded-lg border border-blue-100 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-4"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-[#0c2a5e]">{aspect.aspect_name}</h2>
                  <p className="mt-1 text-xs text-gray-500">{aspect.description}</p>
                </div>

                <div className="w-full sm:w-auto sm:shrink-0">
                  <div
                    role="group"
                    aria-label={`Rating for ${aspect.aspect_name}`}
                    className="grid grid-cols-5 gap-2 sm:flex sm:items-center"
                  >
                    {[1, 2, 3, 4, 5].map((value) => {
                      const selected = ratings[aspect.aspect_id] === value

                      return (
                        <button
                          key={value}
                          type="button"
                          aria-label={`Rate ${aspect.aspect_name}: ${value}`}
                          aria-pressed={selected}
                          onClick={() => setRating(aspect.aspect_id, value)}
                          className={`flex h-11 w-full items-center justify-center rounded-lg border text-sm font-semibold transition sm:h-9 sm:w-9 sm:rounded-full sm:text-xs ${
                            selected
                              ? 'border-[#0c2a5e] bg-[#0c2a5e] text-white'
                              : 'border-blue-200 bg-white text-[#0c2a5e] hover:border-[#0c2a5e] hover:bg-blue-50'
                          }`}
                        >
                          {value}
                        </button>
                      )
                    })}
                  </div>

                  {/* Gabay sa scale, sa cellphone lang */}
                  <div className="mt-1 flex justify-between px-0.5 text-[10px] text-gray-400 sm:hidden">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate('/evaluation/choose-category')}
            className="flex w-full items-center justify-center gap-1 rounded-md border border-[#0c2a5e] px-4 py-2.5 text-sm text-[#0c2a5e] transition hover:bg-blue-50 sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
          </button>

          <button
            type="button"
            disabled={!complete || aspects.length === 0}
            onClick={handleNext}
            className="flex w-full items-center justify-center gap-1 rounded-md bg-[#0c2a5e] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0a2249] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {complete && <CheckCircle2 className="h-4 w-4" />}
            {allCategoriesDone ? 'Review & Submit' : 'Finish Category'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </EvaluationLayout>
  )
}