import { useState, useEffect } from 'react';
import { tasksAPI, type Task, type TaskStatus, type TaskPriority } from '../services/api';
import {
  ListTodo,
  Calendar,
  Menu,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Loader2,
} from 'lucide-react';

interface MyTasksPageProps {
  onOpenProject: (id: string) => void;
  onToggleSidebar: () => void;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  'todo': { label: 'To Do', color: 'text-gray-600', bg: 'bg-gray-100' },
  'in-progress': { label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-100' },
  'review': { label: 'Review', color: 'text-amber-600', bg: 'bg-amber-100' },
  'done': { label: 'Done', color: 'text-emerald-600', bg: 'bg-emerald-100' },
};

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export function MyTasksPage({ onOpenProject, onToggleSidebar }: MyTasksPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await tasksAPI.getMyTasks();
      setTasks(data);
    } catch (err: any) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const now = new Date();

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await tasksAPI.update(taskId, { status });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Group tasks
  const overdue = filteredTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done');
  const today = filteredTasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false;
    const d = new Date(t.dueDate);
    return d.toDateString() === now.toDateString();
  });
  const upcoming = filteredTasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false;
    const d = new Date(t.dueDate);
    return d > now && d.toDateString() !== now.toDateString();
  });
  const noDue = filteredTasks.filter(t => !t.dueDate && t.status !== 'done');
  const completed = filteredTasks.filter(t => t.status === 'done');

  const sections = [
    { title: 'Overdue', tasks: overdue, icon: AlertCircle, color: 'text-red-600' },
    { title: 'Today', tasks: today, icon: Clock, color: 'text-amber-600' },
    { title: 'Upcoming', tasks: upcoming, icon: Calendar, color: 'text-blue-600' },
    { title: 'No Due Date', tasks: noDue, icon: ListTodo, color: 'text-gray-600' },
    { title: 'Completed', tasks: completed, icon: CheckCircle2, color: 'text-emerald-600' },
  ].filter(s => s.tasks.length > 0);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onToggleSidebar} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
              <p className="text-gray-500 text-sm mt-0.5">{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as TaskStatus | 'all')}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as TaskPriority | 'all')}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
            >
              <option value="all">All Priority</option>
              {PRIORITY_OPTIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {sections.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ListTodo className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-500 text-sm">Tasks assigned to you will appear here</p>
          </div>
        ) : (
          sections.map(section => (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-3">
                <section.icon className={`w-4.5 h-4.5 ${section.color}`} />
                <h2 className={`text-sm font-semibold ${section.color}`}>{section.title}</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{section.tasks.length}</span>
              </div>
              <div className="space-y-2">
                {section.tasks.map(task => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'done';
                  return (
                    <div
                      key={task.id}
                      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all flex items-center gap-4"
                    >
                      {/* Checkbox-style status toggle */}
                      <button
                        onClick={() => handleStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${
                          task.status === 'done'
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-gray-300 hover:border-indigo-400'
                        }`}
                      >
                        {task.status === 'done' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-medium ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {task.title}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {PRIORITY_OPTIONS.find(p => p.value === task.priority)?.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {task.projectName && (
                            <button
                              onClick={() => onOpenProject(task.projectId)}
                              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              {task.projectName}
                            </button>
                          )}
                          {task.dueDate && (
                            <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>

                      <select
                        value={task.status}
                        onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 outline-none cursor-pointer ${STATUS_CONFIG[task.status].bg} ${STATUS_CONFIG[task.status].color}`}
                      >
                        {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(s => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
