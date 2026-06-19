import type { Task } from '../types/task'
import { TaskItem } from './TaskItem'

interface Props {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

/** Renders the tasks in the order the API returns them (newest-first). */
export function TaskList({ tasks, onEdit, onDelete }: Props) {
  return (
    <ul className="task-list">
      {tasks.map((task, index) => (
        <TaskItem
          key={task.id}
          task={task}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}
