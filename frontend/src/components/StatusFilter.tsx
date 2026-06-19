import {
  STATUS_LABELS,
  TASK_STATUSES,
  type StatusFilterValue,
} from '../types/task'

interface Props {
  value: StatusFilterValue
  onChange: (value: StatusFilterValue) => void
}

const OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: 'ALL', label: 'All' },
  ...TASK_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
]

/** Tabs to filter the list by status; "All" restores the full list (AC-16). */
export function StatusFilter({ value, onChange }: Props) {
  return (
    <div
      className="status-filter"
      role="tablist"
      aria-label="Filter tasks by status"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          className={`filter-tab${value === opt.value ? ' active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
