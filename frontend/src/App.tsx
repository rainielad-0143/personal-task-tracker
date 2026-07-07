import { useState } from 'react'
import './App.css'
import { useAuth } from './auth/useAuth'
import { AuthForm } from './components/AuthForm'
import { TasksView } from './components/TasksView'
import { TicketsView } from './components/TicketsView'

type View = 'tasks' | 'tickets'

/**
 * Auth gate: while a stored token is being validated we show nothing useful,
 * anonymous users get the login/register form, and authenticated users get the
 * tracker with a Tasks/Tickets switcher.
 */
function App() {
  const { status } = useAuth()
  const [view, setView] = useState<View>('tasks')

  if (status === 'loading') {
    return <p className="loading">Loading…</p>
  }

  if (status !== 'authenticated') {
    return <AuthForm />
  }

  return (
    <>
      <nav className="app-nav" aria-label="Primary">
        <button
          type="button"
          aria-current={view === 'tasks'}
          className={`nav-tab${view === 'tasks' ? ' active' : ''}`}
          onClick={() => setView('tasks')}
        >
          Tasks
        </button>
        <button
          type="button"
          aria-current={view === 'tickets'}
          className={`nav-tab${view === 'tickets' ? ' active' : ''}`}
          onClick={() => setView('tickets')}
        >
          Tickets
        </button>
      </nav>
      {view === 'tasks' ? <TasksView /> : <TicketsView />}
    </>
  )
}

export default App
