import { CheckCircle2, Circle, ListTodo } from 'lucide-react'

function TaskList({ tasks = [], loading = false }) {
  if (loading) {
    return <div className="mission-skeleton h-[180px]" />
  }

  if (!tasks.length) {
    return (
      <div className="mission-empty h-[180px]">
        <ListTodo size={16} /> No pending tasks. Great momentum.
      </div>
    )
  }

  return (
    <ul className="task-list">
      {tasks.slice(0, 5).map((task) => {
        const isDone = task.status === 'Completed'
        return (
          <li key={task._id || task.id || task.title} className="task-item">
            <span className="task-icon">{isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}</span>
            <div>
              <p className="task-title">{task.title}</p>
              <p className="task-meta">
                {task.priority || 'Medium'} priority {task.dueDate ? `• due ${new Date(task.dueDate).toLocaleDateString()}` : ''}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default TaskList
