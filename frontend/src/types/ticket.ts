// Shared DTO shapes — kept in sync with the backend (spec-tickets.md §2).

export type Tracker = 'JIRA' | 'GITHUB' | 'OTHER'
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED'

export const TRACKERS: readonly Tracker[] = ['JIRA', 'GITHUB', 'OTHER']
export const TICKET_STATUSES: readonly TicketStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'CLOSED',
]

/** Human-friendly labels. */
export const TRACKER_LABELS: Record<Tracker, string> = {
  JIRA: 'Jira',
  GITHUB: 'GitHub',
  OTHER: 'Other',
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  CLOSED: 'Closed',
}

export interface Ticket {
  id: string
  key: string
  title: string | null
  tracker: Tracker
  url: string | null
  status: TicketStatus
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}

export interface CreateTicketInput {
  key: string
  title?: string | null
  tracker?: Tracker
  url?: string | null
  status?: TicketStatus
}

export type UpdateTicketInput = Partial<CreateTicketInput>

/** The list filter adds an "ALL" option on top of the real statuses/trackers. */
export type TicketStatusFilterValue = TicketStatus | 'ALL'
export type TrackerFilterValue = Tracker | 'ALL'
