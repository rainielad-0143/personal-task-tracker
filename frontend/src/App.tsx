import './App.css'
import { useAuth } from './auth/useAuth'
import { AuthForm } from './components/AuthForm'
import { TasksView } from './components/TasksView'

/**
 * Auth gate: while a stored token is being validated we show nothing useful,
 * anonymous users get the login/register form, and authenticated users get the
 * task tracker.
 */
function App() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <p className="loading">Loading…</p>
  }

  return status === 'authenticated' ? <TasksView /> : <AuthForm />
}

export default App
