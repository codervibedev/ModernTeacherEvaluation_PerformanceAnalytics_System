import { Check } from 'lucide-react'
import logoImage from '../assets/LOGOICCT.png'

const STEPS = [
  'Student Information',
  'Select Teacher',
  'Choose Category',
  'Rate The Aspects',
  'Review & Submit',
]

export default function EvaluationLayout({ step, hideProgress = false, children }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="flex items-center gap-3 bg-[#0c2a5e] px-4 py-3 sm:gap-4 sm:px-6">
        <img
          src={logoImage}
          alt="ICCT logo"
          className="h-10 w-10 shrink-0 rounded-full object-cover sm:h-12 sm:w-12"
        />

        <div className="h-9 w-px shrink-0 bg-white/30" />

        <div className="min-w-0">
          <p className="text-xs font-semibold leading-tight text-white sm:text-sm">
            ICCT COLLEGES FOUNDATION, INC.
          </p>
          <p className="text-[8px] leading-tight tracking-wider text-blue-200 sm:text-[10px] sm:tracking-widest">
            MODERN TEACHER EVALUATION &amp; PERFORMANCE ANALYTICS SYSTEM
          </p>
        </div>
      </header>

      {/* Buong lapad ng screen, may padding lang sa gilid */}
      <div className="flex w-full flex-1 flex-col px-4 pt-6 sm:px-8 sm:pt-8 lg:px-12">
        {/* Progress guide (nakatago sa Evaluation Submitted) */}
        {!hideProgress && (
          <nav aria-label="Evaluation progress">
            <ol className="flex items-start justify-between">
              {STEPS.map((label, i) => {
                const n = i + 1
                const done = n < step
                const active = n === step

                return (
                  <li
                    key={label}
                    aria-current={active ? 'step' : undefined}
                    className="relative flex flex-1 flex-col items-center"
                  >
                    {/* Connecting line */}
                    {i > 0 && (
                      <div
                        className={`absolute right-1/2 top-3 h-px w-full sm:top-3.5 ${
                          n <= step ? 'bg-blue-400' : 'bg-gray-300'
                        }`}
                      />
                    )}

                    {/* Step circle */}
                    <div
                      className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold sm:h-7 sm:w-7 sm:text-xs ${
                        active
                          ? 'bg-[#0c2a5e] text-white'
                          : done
                            ? 'bg-blue-400 text-white'
                            : 'border border-gray-300 bg-white text-gray-500'
                      }`}
                    >
                      {done ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : n}
                    </div>

                    {/* Step label: sa cellphone, ang active step lang ang may label */}
                    <span
                      className={`mt-1.5 px-0.5 text-center text-[10px] leading-tight sm:px-1 sm:text-[11px] ${
                        active
                          ? 'font-semibold text-[#0c2a5e]'
                          : done
                            ? 'hidden text-[#0c2a5e] sm:block'
                            : 'hidden text-gray-500 sm:block'
                      }`}
                    >
                      {label}
                    </span>
                  </li>
                )
              })}
            </ol>
          </nav>
        )}

        {/* Page content */}
        <main
          className={`flex-1 pb-8 sm:pb-12 ${hideProgress ? '' : 'mt-6 sm:mt-8'}`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}