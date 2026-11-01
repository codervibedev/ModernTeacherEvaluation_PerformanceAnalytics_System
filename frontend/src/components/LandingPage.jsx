import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import heroImage from '../assets/school.png'
import logoImage from '../assets/LOGOICCT.png'
import {
  User, GraduationCap, ListChecks,
  Star, CheckCircle2, Info,
  Menu, X, ChevronDown,
} from 'lucide-react'

// ====== LINKS ======
const FACEBOOK_URL = 'https://www.facebook.com/share/1Bfy2sN5zi/'
const CONTACT_EMAIL = 'info@icct.educ.ph'
// Bubukas ang Gmail compose sa browser na may naka-fill na "To"
const GMAIL_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${CONTACT_EMAIL}`
// ===================

// Filled icons para sa Be Honest / Be Fair / Confidential (kapareho ng reference)
const FilledIcon = ({ path, className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d={path} />
  </svg>
)
const ICON_CLIPBOARD = 'M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z'
const ICON_SHIELD = 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'
const ICON_LOCK = 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z'

const FacebookIcon = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className}>
    <path fill="#1877F2" d="M24 4C12.95 4 4 12.95 4 24c0 9.98 7.31 18.26 16.88 19.76V29.78h-5.08V24h5.08v-4.41c0-5.01 2.99-7.78 7.55-7.78 2.19 0 4.48.39 4.48.39v4.92h-2.52c-2.48 0-3.26 1.54-3.26 3.12V24h5.54l-.89 5.78h-4.65v13.98C36.69 42.26 44 33.98 44 24c0-11.05-8.95-20-20-20z" />
    <path fill="#fff" d="M32.33 29.78L33.22 24h-5.54v-3.75c0-1.58.77-3.12 3.26-3.12h2.52v-4.92s-2.29-.39-4.48-.39c-4.56 0-7.55 2.77-7.55 7.78V24h-5.08v5.78h5.08v13.98a20.2 20.2 0 006.25 0V29.78h4.65z" />
  </svg>
)

const GmailIcon = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className}>
    <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z" />
    <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z" />
    <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" />
    <path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z" />
    <path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0C43.076,8,45,9.924,45,12.298z" />
  </svg>
)

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  // Mobile lang: bukas/sarado ang Guidelines panel
  const [guidelinesOpen, setGuidelinesOpen] = useState(false)

  // Isara ang menu gamit ang Esc key
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <div className="min-h-screen bg-[#0c2a5e]">
      <style>{`
        @keyframes heroSlideIn {
          from { opacity: 0; transform: translateX(-28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .hero-slide-in { animation: heroSlideIn 1.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .hero-slide-in { animation: none; } }
      `}</style>

      {/* Top bar: navy blue */}
      <header className="relative z-50 flex items-center justify-between bg-[#0c2a5e] px-4 py-2 sm:px-8 lg:px-15">
        <div className="flex min-w-0 items-center gap-3 lg:gap-4">
          <img
            src={logoImage}
            alt="ICCT logo"
            className="h-11 w-auto shrink-0 object-contain lg:h-12"
          />
          <div className="min-w-0 border-l border-white/40 pl-3 lg:pl-4">
            <p className="text-sm font-bold leading-tight tracking-wider text-white">ICCT COLLEGES</p>
            <p className="mt-1 text-[9px] leading-tight tracking-[0.25em] text-blue-100 sm:text-[10px] lg:tracking-[0.3em]">
              FOUNDATION, INC.
            </p>
          </div>
        </div>

        {/* Desktop contact links (hindi nagbago ang itsura) */}
        <div className="hidden self-stretch border-l border-white/40 pl-10 pr-14 text-xs text-white lg:flex lg:flex-col lg:justify-center lg:gap-1.5">
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition hover:text-blue-200"
          >
            <FacebookIcon className="h-4 w-4" /> ICCT Colleges
          </a>
          <a
            href={GMAIL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition hover:text-blue-200"
          >
            <GmailIcon className="h-4 w-4" /> {CONTACT_EMAIL}
          </a>
        </div>

        {/* Mobile/tablet: burger menu */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-contact-menu"
          className="flex h-10 w-10 items-center justify-center rounded-md text-white transition hover:bg-white/10 lg:hidden"
        >
          {menuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>

        {menuOpen && (
          <>
            {/* Click sa labas = close */}
            <div
              className="fixed inset-0 z-40 lg:hidden"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div
              id="mobile-contact-menu"
              className="absolute right-4 top-full z-50 mt-1 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-blue-100 bg-white shadow-xl sm:right-8 lg:hidden"
            >
              <p className="border-b border-gray-100 bg-blue-50 px-4 py-2 text-[10px] font-semibold tracking-widest text-gray-500">
                CONTACT US
              </p>

              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-blue-50"
              >
                <FacebookIcon className="h-6 w-6 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0c2a5e]">Facebook</p>
                  <p className="truncate text-xs text-gray-500">ICCT Colleges</p>
                </div>
              </a>

              <a
                href={GMAIL_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 transition hover:bg-blue-50"
              >
                <GmailIcon className="h-6 w-6 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0c2a5e]">Email</p>
                  <p className="truncate text-xs text-gray-500">{CONTACT_EMAIL}</p>
                </div>
              </a>
            </div>
          </>
        )}
      </header>

      {/* Hero + Benefits
          Mobile/tablet: school image ang background sa ibaba ng hero; ang Guidelines ay
          nakatago hanggang pindutin ang "View Guidelines".
          Desktop (lg+): kapareho ng original (laging naka-overlay ang guidelines). */}
      <section className="relative flex flex-col overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-blue-50 lg:block lg:overflow-visible lg:bg-none lg:bg-blue-50">
        {/* Hero text */}
        <div className="relative z-10 px-5 pb-4 pt-6 sm:px-10 sm:pt-8 lg:absolute lg:inset-0 lg:flex lg:items-center lg:p-0 lg:pb-24">
          <div className="max-w-2xl lg:px-10">
            <p className="mb-2 text-[11px] font-semibold tracking-wide text-[#0c2a5e] sm:text-xs">
              — ICCT COLLEGES FOUNDATION, INC.
            </p>
            <h1 className="hero-slide-in mb-2 text-[32px] font-extrabold leading-[1.1] text-[#0c2a5e] max-[360px]:text-[28px] sm:text-4xl lg:whitespace-nowrap lg:text-[42px] lg:leading-tight">
              Modern Teacher Evaluation
            </h1>
            <h2
              className="hero-slide-in mb-4 text-lg font-semibold text-blue-600 max-[360px]:text-base sm:text-2xl"
              style={{ animationDelay: '0.5s' }}
            >
              &amp; Performance Analytics System
            </h2>
            <p className="mb-6 max-w-md text-sm text-gray-700">
              Your feedback helps evaluate teaching performance, identify areas
              for improvement, and promote a better learning experience for
              all students.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:block">
              <Link
                to="/evaluation/student-info"
                className="inline-block w-64 max-w-full rounded-lg bg-[#0c2a5e] px-6 py-3 text-center font-medium text-white shadow-md transition hover:bg-[#0a2249] lg:w-auto"
              >
                Start Evaluation →
              </Link>

              {/* Mobile lang */}
              <button
                type="button"
                onClick={() => setGuidelinesOpen((v) => !v)}
                aria-expanded={guidelinesOpen}
                aria-controls="hero-guidelines"
                className="inline-flex w-64 max-w-full items-center justify-center gap-2 rounded-lg border border-[#0c2a5e] bg-white/70 px-6 py-3 font-medium text-[#0c2a5e] transition hover:bg-white lg:hidden"
              >
                {guidelinesOpen ? 'Hide Guidelines' : 'View Guidelines'}
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${guidelinesOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Be Honest / Be Fair / Confidential
            Mobile: nakatago by default, vertical na puting panel kapag binuksan.
            Desktop: laging nakikita, original (3 columns, walang background) */}
        <div
          id="hero-guidelines"
          className={`${guidelinesOpen ? 'block' : 'hidden'} relative z-10 mx-5 mb-4 rounded-xl border border-blue-100 bg-white/95 px-4 py-1 shadow-sm sm:mx-10 lg:absolute lg:bottom-0 lg:left-0 lg:m-0 lg:block lg:w-full lg:max-w-4xl lg:rounded-none lg:border-0 lg:bg-transparent lg:px-10 lg:py-0 lg:pb-6 lg:shadow-none`}
        >
          <div className="grid grid-cols-1 divide-y divide-[#102F67]/15 lg:grid-cols-3 lg:divide-x lg:divide-y-0 lg:divide-gray-300">
            {[
              { path: ICON_CLIPBOARD, title: 'Be Honest', desc: 'Provide honest and constructive feedback based on your actual learning experience.' },
              { path: ICON_SHIELD, title: 'Be Fair', desc: 'Evaluate each category fairly and objectively based on your experience.' },
              { path: ICON_LOCK, title: 'Confidential', desc: 'Your responses will be handled confidentially and used solely for academic assessment and teaching performance evaluation.' },
            ].map((item, i) => (
              <div
                key={item.title}
                className={`flex min-w-0 items-start gap-3 py-3 lg:py-0 ${
                  i === 0 ? 'lg:pr-5' : 'lg:px-5'
                }`}
              >
                <FilledIcon path={item.path} className="mt-0.5 h-6 w-6 shrink-0 text-blue-700" />
                <div className="min-w-0">
                  <p className="mb-1 text-sm font-bold text-[#102F67] lg:text-[#0c2a5e]">{item.title}</p>
                  <p className="break-words text-xs leading-snug text-[#102F67] lg:text-gray-700">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* School image. Mobile: nasa dulo ng hero (background na may fade sa taas).
            Desktop: nawawala ang wrapper (contents) kaya kapareho ng original */}
        <div className="relative h-56 sm:h-80 lg:contents">
          <img
            src={heroImage}
            alt="ICCT Colleges building"
            className="pointer-events-none absolute bottom-0 right-0 h-auto w-[185%] max-w-none select-none [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_32%,black_88%,transparent)] [mask-image:linear-gradient(to_bottom,transparent,black_32%,black_88%,transparent)] sm:w-[135%] md:w-full lg:static lg:h-[560px] lg:w-full lg:max-w-full lg:object-cover lg:object-right lg:[-webkit-mask-image:none] lg:[mask-image:none]"
          />
        </div>

        {/* Overlays (desktop lang) */}
        <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-blue-50/50 via-transparent to-transparent lg:block" />
        <div
          className="pointer-events-none absolute bottom-0 left-0 hidden h-40 w-[60%] bg-gradient-to-t from-blue-100/80 via-blue-100/35 to-transparent lg:block"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, black 65%, transparent)',
            maskImage: 'linear-gradient(to right, black 65%, transparent)',
          }}
        />
      </section>

      {/* Evaluation process — NAVY background, white cards */}
      <section
        className="bg-[#0c2a5e] px-5 pb-6 pt-8 sm:px-10"
        style={{ backgroundImage: 'radial-gradient(ellipse 70% 120% at 50% 0%, rgba(59,130,246,0.28), transparent 70%)' }}
      >
        <div className="mb-4 flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-3">
          <p className="text-sm font-semibold text-white">— EVALUATION PROCESS</p>
          <p className="text-sm text-blue-200">
            Follow these simple steps to complete your teacher evaluation accurately and successfully.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
          {[
            { icon: User, label: 'Enter Student Information', desc: 'Provide your Student ID and Section to begin the teacher evaluation.' },
            { icon: GraduationCap, label: 'Select Teacher', desc: 'Choose the teacher you would like to evaluate.' },
            { icon: ListChecks, label: 'Choose Category', desc: 'Select an evaluation category to review its specific aspects.' },
            { icon: Star, label: 'Rate The Aspects', desc: 'Rate each aspect fairly based on your actual classroom experience.' },
            { icon: CheckCircle2, label: 'Review & Submit', desc: 'Review your ratings and submit your completed evaluation.' },
          ].map((step, i, steps) => (
            <div
              key={step.label}
              className={`${i === steps.length - 1 && steps.length % 2 === 1 ? 'col-span-2 lg:col-span-1' : ''} group relative flex items-center gap-3 overflow-hidden rounded-xl border border-white/80 bg-gradient-to-b from-white via-white to-blue-50 p-3 text-left shadow-[0_10px_28px_-8px_rgba(59,130,246,0.55)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_-8px_rgba(96,165,250,0.8)] lg:block lg:p-4 lg:text-center`}
            >
              {/* Thin light line on the top edge + soft glow */}
              <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
              <div className="pointer-events-none absolute -top-10 left-1/2 h-20 w-32 -translate-x-1/2 rounded-full bg-blue-300/30 blur-2xl" />

              {/* Icon with its own glow */}
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-blue-50 to-blue-100 shadow-[0_0_14px_rgba(59,130,246,0.35)] ring-1 ring-blue-200 lg:mx-auto lg:mb-2 lg:h-9 lg:w-9">
                <step.icon className="h-5 w-5 text-[#0c2a5e]" />
              </div>

              <div className="relative min-w-0">
                <p className="mb-1 text-xs font-semibold text-[#0c2a5e]">{step.label}</p>
                <p className="text-[11px] leading-snug text-gray-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="flex items-center justify-center gap-3 border-t border-white/10 bg-[#0c2a5e] px-5 py-3 text-left text-xs text-blue-100 lg:gap-2 lg:px-0 lg:text-center">
        <Info className="h-5 w-5 shrink-0 lg:h-3.5 lg:w-3.5" />
        <span>
          This system is for ICCT students only. Please ensure that you provide
          accurate information and complete all 6 categories.
        </span>
      </footer>
    </div>
  )
}