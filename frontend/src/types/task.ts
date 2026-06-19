// Shared DTO shapes — kept in sync with the backend (spec.md §2).

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

export const TASK_STATUSES: readonly TaskStatus[] = [
  'TODO',
  'IN_PROGRESS',
  'DONE',
]

/** Human-friendly labels for each status. */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  ticketRef: string | null
  dueDate: string | null // ISO 8601
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}

export interface CreateTaskInput {
  title: string
  description?: string | null
  status?: TaskStatus
  ticketRef?: string | null
  dueDate?: string | null
}

export type UpdateTaskInput = Partial<CreateTaskInput>

/** The list filter adds an "ALL" option on top of the real statuses. */
export type StatusFilterValue = TaskStatus | 'ALL'
