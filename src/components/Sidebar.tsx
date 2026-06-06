import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  LogOut,
  CheckSquare,
  ChevronLeft,
  Menu,
} from 'lucide-react';

type Page = 'dashboard' | 'projects' | 'tasks';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ currentPage, onNavigate, collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects' as Page, label: 'Projects', icon: FolderKanban },
    { id: 'tasks' as Page, label: 'My Tasks', icon: ListTodo },
  ];

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-50 inset-y-0 left-0 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
          collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-64'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className={`flex items-center gap-2.5 ${collapsed ? 'lg:justify-center lg:w-full' : ''}`}>
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            {!collapsed && <span className="text-lg font-bold text-gray-900">TaskFlow</span>}
          </div>
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                if (window.innerWidth < 1024) onToggle();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                currentPage === item.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${currentPage === item.id ? 'text-indigo-600' : ''}`} />
              {!collapsed && item.label}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-gray-100">
          <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all mt-1 cursor-pointer ${
              collapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      </aside>
    </>
  );
}
