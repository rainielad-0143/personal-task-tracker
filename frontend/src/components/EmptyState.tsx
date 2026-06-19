interface Props {
  message: string
}

/** Shown when no tasks match the current view (AC-20). */
export function EmptyState({ message }: Props) {
  return (
    <div className="empty-state" role="status">
      <p>{message}</p>
    </div>
  )
}
