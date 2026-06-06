import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectsAPI, tasksAPI, type Project, type Task, type TaskStatus, type TaskPriority, type ProjectMember } from '../services/api';
import {
  ArrowLeft,
  Plus,
  X,
  Pencil,
  Trash2,
  Users,
  UserPlus,
  Shield,
  User as UserIcon,
  Calendar,
  Menu,
  GripVertical,
  MoreVertical,
  Search,
  Filter,
  Crown,
  Loader2,
} from 'lucide-react';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
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

export function ProjectDetail({ projectId, onBack, onToggleSidebar }: ProjectDetailProps) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskMenuOpen, setTaskMenuOpen] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'board' | 'list' | 'members'>('board');

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskAssignee, setTaskAssignee] = useState<string>('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('todo');
  const [taskError, setTaskError] = useState('');
  const [taskSaving, setTaskSaving] = useState(false);

  // Member form
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'admin' | 'member'>('member');
  const [memberError, setMemberError] = useState('');
  const [memberSaving, setMemberSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectData, tasksData] = await Promise.all([
        projectsAPI.getById(projectId),
        tasksAPI.getProjectTasks(projectId),
      ]);
      setProject(projectData);
      setTasks(tasksData);
    } catch (err: any) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!project || !user) return null;

  const isAdmin = project.role === 'admin';
  const createdById = typeof project.createdBy === 'string' ? project.createdBy : project.createdBy.id;

  const filteredTasks = tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const tasksByStatus = {
    'todo': filteredTasks.filter(t => t.status === 'todo'),
    'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
    'review': filteredTasks.filter(t => t.status === 'review'),
    'done': filteredTasks.filter(t => t.status === 'done'),
  };

  const openTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskTitle(task.title);
      setTaskDesc(task.description);
      setTaskPriority(task.priority);
      setTaskAssignee(task.assigneeId || '');
      setTaskDueDate(task.dueDate || '');
      setTaskStatus(task.status);
    } else {
      setEditingTask(null);
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('medium');
      setTaskAssignee('');
      setTaskDueDate('');
      setTaskStatus('todo');
    }
    setTaskError('');
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError('');
    if (!taskTitle.trim()) { setTaskError('Task title is required'); return; }
    setTaskSaving(true);

    try {
      if (editingTask) {
        await tasksAPI.update(editingTask.id, {
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          priority: taskPriority,
          assigneeId: taskAssignee || null,
          dueDate: taskDueDate || null,
          status: taskStatus,
        });
      } else {
        await tasksAPI.create({
          projectId,
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          priority: taskPriority,
          assigneeId: taskAssignee || null,
          dueDate: taskDueDate || null,
        });
      }
      setShowTaskModal(false);
      fetchData();
    } catch (err: any) {
      setTaskError(err.message || 'Failed to save task');
    } finally {
      setTaskSaving(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Delete this task?')) {
      try {
        await tasksAPI.delete(taskId);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete task');
      }
    }
    setTaskMenuOpen(null);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError('');
    if (!memberEmail.trim()) { setMemberError('Email is required'); return; }
    setMemberSaving(true);

    try {
      const { members } = await projectsAPI.addMember(projectId, memberEmail, memberRole);
      setProject({ ...project, members });
      setMemberEmail('');
      setMemberRole('member');
      setShowMemberModal(false);
    } catch (err: any) {
      setMemberError(err.message || 'Failed to add member');
    } finally {
      setMemberSaving(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (userId === createdById) return;
    if (confirm('Remove this member?')) {
      try {
        const { members } = await projectsAPI.removeMember(projectId, userId);
        setProject({ ...project, members });
      } catch (err: any) {
        alert(err.message || 'Failed to remove member');
      }
    }
  };

  const handleRoleChange = async (userId: string, role: 'admin' | 'member') => {
    try {
      const { members } = await projectsAPI.updateMemberRole(projectId, userId, role);
      setProject({ ...project, members });
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  const getAssigneeName = (id: string | null) => {
    if (!id) return 'Unassigned';
    const member = project.members.find(m => m.userId === id);
    return member?.name || 'Unknown';
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const now = new Date();

  const TaskCard = ({ task }: { task: Task }) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'done';
    const priorityLabel = PRIORITY_OPTIONS.find(p => p.value === task.priority)?.label || task.priority;

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-3.5 hover:shadow-md transition-all group relative">
        <div className="flex items-start justify-between mb-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
            task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
            task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {priorityLabel}
          </span>

          <div className="relative">
            <button
              onClick={() => setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
            {taskMenuOpen === task.id && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setTaskMenuOpen(null)} />
                <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1">
                  <button
                    onClick={() => { openTaskModal(task); setTaskMenuOpen(null); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <h4 className="text-sm font-medium text-gray-900 mb-1 leading-snug">{task.title}</h4>
        {task.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
        )}

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5">
            {task.assigneeId ? (
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold" title={getAssigneeName(task.assigneeId)}>
                {getInitials(getAssigneeName(task.assigneeId))}
              </div>
            ) : (
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                <UserIcon className="w-3 h-3" />
              </div>
            )}
          </div>

          {task.dueDate && (
            <span className={`text-[11px] font-medium flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onToggleSidebar} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{project.name}</h1>
            <p className="text-sm text-gray-500 truncate">{project.description || 'No description'}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => { setShowMemberModal(true); setMemberError(''); setMemberEmail(''); }}
                className="px-3 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Member</span>
              </button>
            )}
            <button
              onClick={() => openTaskModal()}
              className="bg-indigo-600 text-white px-3 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {(['board', 'list', 'members'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'board' ? 'Board' : tab === 'list' ? 'List' : `Members (${project.members.length})`}
            </button>
          ))}
        </div>

        {/* Filters */}
        {activeTab !== 'members' && (
          <div className="flex flex-wrap items-center gap-3 mt-4">
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
        )}
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Board View */}
        {activeTab === 'board' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(status => (
              <div key={status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      status === 'todo' ? 'bg-gray-400' :
                      status === 'in-progress' ? 'bg-blue-500' :
                      status === 'review' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`} />
                    <h3 className="text-sm font-semibold text-gray-700">{STATUS_CONFIG[status].label}</h3>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {tasksByStatus[status].length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 min-h-[200px] bg-gray-100/50 rounded-xl p-2">
                  {tasksByStatus[status].map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {tasksByStatus[status].length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs">No tasks</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {activeTab === 'list' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Task</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Assignee</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Priority</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Due Date</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">No tasks found</td>
                    </tr>
                  ) : (
                    filteredTasks.map(task => {
                      const isOverdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'done';
                      return (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                              <div>
                                <span className="text-sm font-medium text-gray-900">{task.title}</span>
                                {task.description && (
                                  <p className="text-xs text-gray-500 truncate max-w-xs mt-0.5">{task.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-sm text-gray-600">{getAssigneeName(task.assigneeId)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={task.status}
                              onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
                              className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 outline-none cursor-pointer ${STATUS_CONFIG[task.status].bg} ${STATUS_CONFIG[task.status].color}`}
                            >
                              {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(s => (
                                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {PRIORITY_OPTIONS.find(p => p.value === task.priority)?.label}
                            </span>
                          </td>
                          <td className={`px-4 py-3 hidden lg:table-cell text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => openTaskModal(task)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Members View */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Team Members
              </h3>
              {isAdmin && (
                <button
                  onClick={() => { setShowMemberModal(true); setMemberError(''); setMemberEmail(''); }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" /> Add Member
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {project.members.map((m: ProjectMember) => (
                <div key={m.userId} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {getInitials(m.name || '??')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{m.name || 'Unknown'}</p>
                        {m.userId === createdById && (
                          <span title="Project Owner"><Crown className="w-3.5 h-3.5 text-amber-500" /></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isAdmin && m.userId !== createdById ? (
                      <>
                        <select
                          value={m.role}
                          onChange={e => handleRoleChange(m.userId, e.target.value as 'admin' | 'member')}
                          className={`text-xs font-medium px-3 py-1.5 rounded-full border outline-none cursor-pointer ${
                            m.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(m.userId)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                        m.role === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50 text-gray-600'
                      }`}>
                        {m.role === 'admin' ? (
                          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>
                        ) : (
                          <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> Member</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowTaskModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">{editingTask ? 'Edit Task' : 'New Task'}</h2>
              <button onClick={() => setShowTaskModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {taskError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{taskError}</div>
            )}

            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  placeholder="Task title"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm resize-none"
                  placeholder="Task description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm cursor-pointer"
                  >
                    {PRIORITY_OPTIONS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                {editingTask && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select
                      value={taskStatus}
                      onChange={e => setTaskStatus(e.target.value as TaskStatus)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm cursor-pointer"
                    >
                      {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(s => (
                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignee</label>
                  <select
                    value={taskAssignee}
                    onChange={e => setTaskAssignee(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {project.members.map((m: ProjectMember) => (
                      <option key={m.userId} value={m.userId}>{m.name || 'Unknown'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskSaving}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {taskSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMemberModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Add Team Member</h2>
              <button onClick={() => setShowMemberModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {memberError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{memberError}</div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Member Email *</label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  placeholder="user@example.com"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">The user must have an account to be added.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select
                  value={memberRole}
                  onChange={e => setMemberRole(e.target.value as 'admin' | 'member')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm cursor-pointer"
                >
                  <option value="member">Member – Can view & update tasks</option>
                  <option value="admin">Admin – Full access to project</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={memberSaving}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {memberSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
