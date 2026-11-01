import { ChevronDown } from 'lucide-react'

export function SelectCard({
  id, label, value, onChange, disabled, children, widthClass = 'sm:min-w-[12rem]',
}) {
  return (
    <div
      className={`relative min-w-0 w-full rounded-xl border border-blue-100 bg-white px-4 py-2.5 shadow-sm transition focus-within:ring-2 focus-within:ring-blue-300 sm:w-auto ${widthClass} ${
        disabled ? '' : 'hover:border-blue-200 hover:shadow'
      }`}
    >
      <label htmlFor={id} className="mb-0.5 block text-center text-xs font-medium text-gray-500">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full cursor-pointer appearance-none bg-transparent px-8 py-0.5 text-center text-base font-semibold text-[#0c2a5e] [text-align-last:center] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 [&>option]:py-2 [&>option]:text-[#0c2a5e] [&>option:checked]:bg-blue-50"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  )
}

const dash = (year) => year.replace('-', '–')

export default function PeriodFilter({ trimesters, value, onChange }) {
  // Kung walang tugmang value (hal. pumalya ang unang load), gamitin ang kasalukuyang trimester
  // para hindi ma-disable ang mga dropdown at makapili pa rin ang admin.
  const current =
    trimesters.find((t) => t.trimester_id === Number(value)) ??
    trimesters.find((t) => t.is_current)

  const years = [...new Set(trimesters.map((t) => t.school_year))].sort().reverse()
  const year = current?.school_year ?? ''

  const inYear = trimesters
    .filter((t) => t.school_year === year)
    .sort((a, b) => a.trimester_name.localeCompare(b.trimester_name))

  const changeYear = (e) => {
    const next = trimesters
      .filter((t) => t.school_year === e.target.value)
      .sort((a, b) => a.trimester_name.localeCompare(b.trimester_name))
    // Kung may kaparehong trimester sa bagong taon, iyon ang pipiliin; kung wala, ang pinakahuli
    const same = next.find((t) => t.trimester_name === current?.trimester_name)
    const target = same ?? next[next.length - 1]
    if (target) onChange(target.trimester_id)
  }

  const changeTrimester = (e) => onChange(Number(e.target.value))

  return (
    <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-stretch sm:gap-5">
      <SelectCard
        id="filter-year"
        label="Academic Year"
        value={year}
        onChange={changeYear}
        disabled={!current}
      >
        {!current && <option value="">—</option>}
        {years.map((y) => (
          <option key={y} value={y}>
            {dash(y)}
          </option>
        ))}
      </SelectCard>

      <SelectCard
        id="filter-trimester"
        label="Trimester"
        value={current?.trimester_id ?? ''}
        onChange={changeTrimester}
        disabled={!current}
      >
        {!current && <option value="">—</option>}
        {inYear.map((t) => (
          <option key={t.trimester_id} value={t.trimester_id}>
            {t.trimester_name}
            {t.is_current ? ' (Current)' : ''}
          </option>
        ))}
      </SelectCard>
    </div>
  )
}