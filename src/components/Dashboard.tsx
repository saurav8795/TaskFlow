import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectsAPI, tasksAPI, type Project, type Task, type TaskStats, type TaskStatus } from '../services/api';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ListTodo,
  ArrowRight,
  FolderKanban,
  Calendar,
  Flame,
  Menu,
  Loader2,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: 'projects' | 'tasks') => void;
  onOpenProject: (id: string) => void;
  onToggleSidebar: () => void;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  'todo': { label: 'To Do', color: 'text-gray-600', bg: 'bg-gray-100' },
  'in-progress': { label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-100' },
  'review': { label: 'Review', color: 'text-amber-600', bg: 'bg-amber-100' },
  'done': { label: 'Done', color: 'text-emerald-600', bg: 'bg-emerald-100' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-gray-500', bg: 'bg-gray-100' },
  medium: { label: 'Medium', color: 'text-blue-600', bg: 'bg-blue-100' },
  high: { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
  urgent: { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100' },
};

export function Dashboard({ onNavigate, onOpenProject, onToggleSidebar }: DashboardProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectsData, tasksData, statsData] = await Promise.all([
          projectsAPI.getAll(),
          tasksAPI.getMyTasks(),
          tasksAPI.getStats(),
        ]);
        setProjects(projectsData);
        setTasks(tasksData);
        setStats(statsData);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="text-indigo-600 hover:underline cursor-pointer">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user || !stats) return null;

  const now = new Date();
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done');
  const upcomingTasks = tasks
    .filter(t => t.dueDate && new Date(t.dueDate) >= now && t.status !== 'done')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);
  const recentTasks = tasks
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onToggleSidebar} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.name.split(' ')[0]}! 👋
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">Here's an overview of your team's progress</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Tasks', value: stats.total, icon: ListTodo, bgIcon: 'bg-indigo-100', textIcon: 'text-indigo-600' },
            { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, bgIcon: 'bg-blue-100', textIcon: 'text-blue-600' },
            { label: 'Completed', value: stats.done, icon: CheckCircle2, bgIcon: 'bg-emerald-100', textIcon: 'text-emerald-600' },
            { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, bgIcon: 'bg-red-100', textIcon: 'text-red-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${stat.bgIcon} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.textIcon}`} />
                </div>
                {i === 2 && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {completionRate}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Task Status Overview */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Task Progress
              </h2>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 cursor-pointer"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(status => {
                const count = status === 'todo' ? stats.todo : 
                              status === 'in-progress' ? stats.inProgress :
                              status === 'review' ? stats.review : stats.done;
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                const config = STATUS_CONFIG[status];
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">{config.label}</span>
                      <span className={`text-sm font-semibold ${config.color}`}>{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          status === 'todo' ? 'bg-gray-400' :
                          status === 'in-progress' ? 'bg-blue-500' :
                          status === 'review' ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overall Completion</span>
                <span className="text-lg font-bold text-indigo-600">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 mt-2">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Projects */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-indigo-600" />
                Projects
              </h2>
              <button
                onClick={() => onNavigate('projects')}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 cursor-pointer"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {projects.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No projects yet</p>
              ) : (
                projects.slice(0, 4).map(p => (
                  <button
                    key={p.id}
                    onClick={() => onOpenProject(p.id)}
                    className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{p.name}</span>
                      <span className="text-xs text-gray-500">{p.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${p.progress}%` }} />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">{p.doneCount}/{p.taskCount} tasks</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{p.members.length} member{p.members.length > 1 ? 's' : ''}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Overdue Tasks */}
          {overdueTasks.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-red-500" />
                Overdue Tasks
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{overdueTasks.length}</span>
              </h2>
              <div className="space-y-2">
                {overdueTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_CONFIG[task.priority].bg.replace('100', '500')}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.projectName} · Due {new Date(task.dueDate!).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_CONFIG[task.priority].bg} ${PRIORITY_CONFIG[task.priority].color}`}>
                      {PRIORITY_CONFIG[task.priority].label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Tasks */}
          <div className={`bg-white rounded-2xl border border-gray-200 p-6 ${overdueTasks.length === 0 ? 'lg:col-span-2' : ''}`}>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Upcoming Deadlines
            </h2>
            <div className="space-y-2">
              {upcomingTasks.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No upcoming deadlines</p>
              ) : (
                upcomingTasks.map(task => {
                  const daysLeft = Math.ceil((new Date(task.dueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.projectName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-xs font-medium ${daysLeft <= 1 ? 'text-red-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-gray-500'}`}>
                          {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Recent Tasks
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Task</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4 hidden sm:table-cell">Project</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 hidden md:table-cell">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentTasks.map(task => {
                  const statusCfg = STATUS_CONFIG[task.status];
                  const priorityCfg = PRIORITY_CONFIG[task.priority];
                  return (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <span className="text-sm font-medium text-gray-900">{task.title}</span>
                      </td>
                      <td className="py-3 pr-4 hidden sm:table-cell">
                        <span className="text-sm text-gray-500">{task.projectName}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-3 hidden md:table-cell">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${priorityCfg.bg} ${priorityCfg.color}`}>
                          {priorityCfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {recentTasks.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">No tasks yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
