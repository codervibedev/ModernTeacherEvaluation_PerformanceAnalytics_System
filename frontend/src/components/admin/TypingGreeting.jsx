import { useEffect, useState } from 'react'

const TYPE_DELAY = 45 // ms bawat letra
const HOLD_TIME = 2200 // ms na mananatili pagkatapos ma-type
const LEAVE_TIME = 500 // ms ng pag-fade out

const TEXT_STYLE = 'text-2xl font-bold text-[#0c2a5e] sm:text-3xl'

// Oras ng device: Morning (12AM-11:59AM), Afternoon (12PM-5:59PM), Evening (6PM pataas)
function greetingFor(date) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function TypingGreeting({ name }) {
  const [text] = useState(() => {
    const greeting = greetingFor(new Date())
    return name ? `${greeting}, ${name}!` : `${greeting}!`
  })

  const [count, setCount] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? text.length // walang typing kung naka-on ang "reduce motion"
      : 0
  )
  const [phase, setPhase] = useState('show') // show -> leaving -> gone

  useEffect(() => {
    let timer
    if (phase === 'show') {
      timer =
        count < text.length
          ? setTimeout(() => setCount((c) => c + 1), TYPE_DELAY)
          : setTimeout(() => setPhase('leaving'), HOLD_TIME)
    } else if (phase === 'leaving') {
      timer = setTimeout(() => setPhase('gone'), LEAVE_TIME)
    }
    return () => clearTimeout(timer)
  }, [phase, count, text])

  if (phase === 'gone') return null

  const leaving = phase === 'leaving'

  return (
    <div
      className={`grid transition-all ease-in-out ${
        leaving ? 'mb-0 grid-rows-[0fr] opacity-0' : 'mb-4 grid-rows-[1fr] opacity-100'
      }`}
      style={{ transitionDuration: `${LEAVE_TIME}ms` }}
    >
      <div className="overflow-hidden">
        {/* Para sa screen reader: buong mensahe agad */}
        <p className="sr-only" role="status">
          {text}
        </p>

        {/* Nakatagong buong teksto para hindi tumalon ang taas habang nagta-type */}
        <div className="relative" aria-hidden="true">
          <p className={`invisible ${TEXT_STYLE}`}>{text}</p>
          <p className={`absolute inset-0 ${TEXT_STYLE}`}>
            {text.slice(0, count)}
            <span className="ml-0.5 inline-block h-[1em] w-[3px] translate-y-[2px] animate-pulse bg-blue-500 align-middle" />
          </p>
        </div>
      </div>
    </div>
  )
}