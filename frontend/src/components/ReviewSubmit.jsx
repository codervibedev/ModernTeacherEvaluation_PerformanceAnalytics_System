import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  ClipboardCheck,
  UserRound,
  CheckCircle2,
  ArrowLeft,
  Send,
  Star,
  Info,
  LoaderCircle,
  AlertCircle,
  ChevronDown,
  GraduationCap,
  MessageCircle,
  Users,
  ShieldCheck,
  UserCheck,
  FileText,
  ClipboardList,
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

// Confetti / party popper effect (walang bagong package). Pumuputok mula sa dalawang ibabang sulok.
function Confetti() {
  const canvasRef = useRef(null)

  useEffect(() => {
    // Igalang ang "reduce motion" setting ng user
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    let w = 0
    let h = 0

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const colors = ['#0c2a5e', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#facc15']
    const particles = []

    const burst = (fromLeft, count) => {
      const scale = Math.min(Math.max(h / 800, 0.8), 1.3)
      for (let i = 0; i < count; i++) {
        // Pataas at papasok sa gitna
        const angle = fromLeft
          ? -(0.9 + Math.random() * 0.5)
          : -(Math.PI - 0.9 - Math.random() * 0.5)
        const speed = (11 + Math.random() * 11) * scale
        particles.push({
          x: fromLeft ? 0 : w,
          y: h,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 6 + Math.random() * 6,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.35,
          color: colors[Math.floor(Math.random() * colors.length)],
          round: Math.random() < 0.3,
          age: 0,
        })
      }
    }

    burst(true, 70)
    burst(false, 70)
    const t1 = setTimeout(() => {
      burst(true, 45)
      burst(false, 45)
    }, 500)

    let raf
    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      let alive = 0

      for (const p of particles) {
        p.age += 1
        p.vy += 0.32 // gravity
        p.vx *= 0.99
        p.vy *= 0.99
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr

        const alpha = p.age > 130 ? Math.max(0, 1 - (p.age - 130) / 50) : 1
        if (alpha <= 0 || p.y > h + 40) continue
        alive += 1

        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        if (p.round) {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        }
        ctx.restore()
      }

      if (alive > 0 || particles.length < 200) {
        raf = requestAnimationFrame(tick)
      } else {
        ctx.clearRect(0, 0, w, h)
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      clearTimeout(t1)
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
    />
  )
}

export default function ReviewSubmit() {
  const navigate = useNavigate()

  const { student, teacher, categories, ratings } = useEvaluation()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  // Lahat naka-close by default. Click = open, click ulit = close.
  const [openIds, setOpenIds] = useState({})

  useEffect(() => {
    if (!student) {
      navigate('/evaluation/student-info', { replace: true })
    } else if (!teacher) {
      navigate('/evaluation/select-teacher', { replace: true })
    }
  }, [student, teacher, navigate])

  function toggleCategory(id) {
    setOpenIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const allAspects = categories.flatMap(category =>
    (category.aspects || []).map(aspect => ({
      ...aspect,
      categoryName: category.category_name,
    }))
  )

  const completedCount = allAspects.filter(
    aspect => ratings[aspect.aspect_id] != null
  ).length

  const allComplete =
    allAspects.length > 0 && completedCount === allAspects.length

  const percent = allAspects.length
    ? (completedCount / allAspects.length) * 100
    : 0

  async function handleSubmit() {
    if (loading || submitted) return

    setError('')

    if (!teacher || !teacher.teacher_id) {
      setError('Please select a teacher before submitting.')
      return
    }

    if (!allComplete) {
      setError('Please rate all aspects before submitting.')
      return
    }

    const ratingPayload = allAspects.map(aspect => ({
      aspect_id: aspect.aspect_id,
      rating_value: Number(ratings[aspect.aspect_id]),
    }))

    setLoading(true)

    try {
      const response = await axios.post(
        '/api/student/evaluations',
        {
          teacher_id: teacher.teacher_id,
          ratings: ratingPayload,
        },
        {
          withCredentials: true,
        }
      )

      if (response.data?.ok) {
        setSubmitted(true)
      } else {
        setError('The server did not confirm the submission. Please try again.')
      }
    } catch (err) {
      const status = err.response?.status
      const message = err.response?.data?.error

      if (status === 409) {
        setError(message || 'You have already evaluated this teacher.')
      } else if (status === 401) {
        setError(
          'Your student verification may have expired. Please verify your Student ID again.'
        )
      } else {
        setError(
          message || 'Unable to submit your evaluation. Please try again.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  if (!student || !teacher) return null

  if (submitted) {
    return (
      <EvaluationLayout step={5} hideProgress>
        <Confetti />
        <div className="mx-auto w-full max-w-2xl rounded-xl border border-emerald-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-600 sm:h-16 sm:w-16" />

          <h1 className="text-xl font-bold text-[#0c2a5e] sm:text-2xl">
            Evaluation Submitted!
          </h1>

          <p className="mt-3 text-sm text-gray-600 sm:text-base">
            Your evaluation for{' '}
            <span className="font-semibold text-[#0c2a5e]">
              Prof. {teacher.name}
            </span>{' '}
            has been successfully recorded.
          </p>

          <p className="mt-2 text-xs text-gray-500 sm:text-sm">
            Thank you for completing the teacher evaluation.
          </p>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#0c2a5e] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0a2249] sm:w-auto"
          >
            <CheckCircle2 className="h-4 w-4" />
            Back to Home
          </button>
        </div>
      </EvaluationLayout>
    )
  }

  return (
    <EvaluationLayout step={5}>
      <div className="w-full rounded-xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        {/* Title */}
        <div className="mb-5 flex items-start gap-3 sm:mb-6 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 sm:h-12 sm:w-12">
            <ClipboardCheck className="h-5 w-5 text-[#0c2a5e] sm:h-6 sm:w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] tracking-widest text-gray-500">
              TEACHER EVALUATION
            </p>
            <h1 className="text-xl font-bold leading-tight text-[#0c2a5e] sm:text-2xl">
              Review &amp; Submit
            </h1>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Tap a category to view your ratings. Tap again to close it.
            </p>
          </div>
        </div>

        {/* Teacher */}
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
            <UserRound className="h-5 w-5 text-[#0c2a5e]" />
          </div>

          <div className="min-w-0">
            <p className="text-xs text-gray-500">Teacher being evaluated</p>
            <p className="truncate text-sm font-semibold text-[#0c2a5e]">
              Prof. {teacher.name}
            </p>
            {teacher.subject && (
              <p className="truncate text-xs text-gray-500">{teacher.subject}</p>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
          <span>Rating progress</span>
          <span>
            {completedCount} of {allAspects.length} aspects rated
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={allAspects.length}
          aria-valuenow={completedCount}
          aria-label="Rated aspects"
          className="mb-2 h-2 overflow-hidden rounded-full bg-gray-100"
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="mb-5 text-xs text-gray-500 sm:text-sm">
          {allComplete
            ? 'All aspects have been rated. You may submit your evaluation.'
            : 'Please complete every rating before submitting.'}
        </p>

        {/* Category list (accordion) */}
        <div className="rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#0c2a5e]">
              Evaluation Categories
            </p>

            {allComplete && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                All rated
              </span>
            )}
          </div>

          {categories.length === 0 ? (
            <p className="text-sm text-gray-500">Loading categories...</p>
          ) : (
            <div className="space-y-3">
              {categories.map(category => {
                const Icon = ICONS[category.category_name] || ClipboardList
                const aspects = category.aspects || []
                const ratedCount = aspects.filter(
                  a => ratings[a.aspect_id] != null
                ).length
                const catComplete =
                  aspects.length > 0 && ratedCount === aspects.length
                const isOpen = !!openIds[category.category_id]
                const panelId = `category-panel-${category.category_id}`

                return (
                  <div
                    key={category.category_id}
                    className={`overflow-hidden rounded-lg border transition ${
                      catComplete
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Header row */}
                    <div className="flex items-stretch">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.category_id)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        className={`flex min-w-0 flex-1 items-center gap-3 p-3 text-left transition sm:p-4 ${
                          catComplete
                            ? 'hover:bg-emerald-100/60'
                            : 'hover:bg-blue-50'
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            catComplete ? 'bg-emerald-100' : 'bg-blue-50'
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              catComplete
                                ? 'text-emerald-700'
                                : 'text-[#0c2a5e]'
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold ${
                              catComplete
                                ? 'text-emerald-800'
                                : 'text-[#0c2a5e]'
                            }`}
                          >
                            {category.category_name}
                          </p>
                          <p
                            className={`mt-0.5 text-xs font-medium ${
                              catComplete ? 'text-emerald-700' : 'text-red-500'
                            }`}
                          >
                            {ratedCount}/{aspects.length} rated
                          </p>
                        </div>

                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Ratings panel */}
                    {isOpen && (
                      <div
                        id={panelId}
                        className="border-t border-gray-200 bg-white"
                      >
                        {category.description && (
                          <p className="px-3 pt-3 text-xs text-gray-500 sm:px-4">
                            {category.description}
                          </p>
                        )}

                        <div className="divide-y divide-gray-100 px-3 sm:px-4">
                          {aspects.map(aspect => {
                            const value = ratings[aspect.aspect_id]

                            return (
                              <div
                                key={aspect.aspect_id}
                                className="flex items-start justify-between gap-3 py-3"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-[#0c2a5e]">
                                    {aspect.aspect_name}
                                  </p>
                                  {aspect.description && (
                                    <p className="mt-0.5 text-xs text-gray-500">
                                      {aspect.description}
                                    </p>
                                  )}
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                  {value != null ? (
                                    <>
                                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                      <span className="text-sm font-bold text-[#0c2a5e]">
                                        {value}/5
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-xs font-medium text-red-500">
                                      Not rated
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 sm:p-4 sm:text-sm"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Reminder */}
        <div className="mt-4 flex gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 sm:p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0c2a5e]" />

          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0c2a5e]">
              Important Reminder
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600 sm:text-sm">
              Please review your ratings carefully. Once submitted, you cannot
              submit another evaluation for the same teacher during the same
              evaluation period.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={loading}
            onClick={() => navigate('/evaluation/choose-category')}
            className="flex w-full items-center justify-center gap-1 rounded-md border border-[#0c2a5e] px-4 py-2.5 text-sm text-[#0c2a5e] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
          </button>

          <button
            type="button"
            disabled={!allComplete || loading || submitted}
            onClick={handleSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0c2a5e] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0a2249] disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
          >
            {loading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Evaluation
              </>
            )}
          </button>
        </div>
      </div>
    </EvaluationLayout>
  )
}