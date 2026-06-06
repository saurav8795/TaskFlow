import { useState, useEffect } from 'react';
import { projectsAPI, type Project } from '../services/api';
import {
  Plus,
  FolderKanban,
  Users,
  ListTodo,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Menu,
  Search,
  Loader2,
} from 'lucide-react';

interface ProjectsPageProps {
  onOpenProject: (id: string) => void;
  onToggleSidebar: () => void;
}

export function ProjectsPage({ onOpenProject, onToggleSidebar }: ProjectsPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsAPI.getAll();
      setProjects(data);
    } catch (err: any) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Project name is required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await projectsAPI.update(editingId, { name: name.trim(), description: description.trim() });
      } else {
        await projectsAPI.create(name.trim(), description.trim());
      }
      setName('');
      setDescription('');
      setShowCreate(false);
      setEditingId(null);
      fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p: Project) => {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description);
    setShowCreate(true);
    setMenuOpen(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this project and all its tasks?')) {
      try {
        await projectsAPI.delete(id);
        fetchProjects();
      } catch (err: any) {
        alert(err.message || 'Failed to delete');
      }
    }
    setMenuOpen(null);
  };

  const gradients = [
    'from-indigo-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-pink-500 to-rose-600',
    'from-violet-500 to-indigo-600',
  ];

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onToggleSidebar} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
              <p className="text-gray-500 text-sm mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={() => { setShowCreate(true); setEditingId(null); setName(''); setDescription(''); setError(''); }}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        </div>

        {projects.length > 0 && (
          <div className="mt-4 relative max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white"
            />
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {searchQuery ? 'Try a different search term' : 'Create your first project to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreate(true)}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project, idx) => (
              <div
                key={project.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
              >
                <div className={`h-2 bg-gradient-to-r ${gradients[idx % gradients.length]}`} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <button
                      onClick={() => onOpenProject(project.id)}
                      className="text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description || 'No description'}</p>
                    </button>

                    {project.role === 'admin' && (
                      <div className="relative ml-2">
                        <button
                          onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen === project.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1">
                              <button
                                onClick={() => handleEdit(project)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(project.id)}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Progress</span>
                      <span className="text-xs font-medium text-gray-700">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full bg-gradient-to-r ${gradients[idx % gradients.length]} transition-all`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ListTodo className="w-3.5 h-3.5" />
                        {project.taskCount} task{project.taskCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {project.members.length}
                      </span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      project.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {project.role === 'admin' ? 'Admin' : 'Member'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowCreate(false); setEditingId(null); }} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Project' : 'New Project'}
              </h2>
              <button
                onClick={() => { setShowCreate(false); setEditingId(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  placeholder="e.g., Website Redesign"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm resize-none"
                  placeholder="Brief description of the project"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setEditingId(null); }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
