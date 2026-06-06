import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage, SignupPage } from './components/AuthPages';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ProjectsPage } from './components/ProjectsPage';
import { ProjectDetail } from './components/ProjectDetail';
import { MyTasksPage } from './components/MyTasksPage';
import { Loader2 } from 'lucide-react';

type Page = 'dashboard' | 'projects' | 'tasks';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authPage === 'login') {
      return <LoginPage onSwitch={() => setAuthPage('signup')} />;
    }
    return <SignupPage onSwitch={() => setAuthPage('login')} />;
  }

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setOpenProjectId(null);
  };

  const handleOpenProject = (id: string) => {
    setOpenProjectId(id);
    setCurrentPage('projects');
  };

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />
      {currentPage === 'dashboard' && (
        <Dashboard
          onNavigate={handleNavigate}
          onOpenProject={handleOpenProject}
          onToggleSidebar={toggleSidebar}
        />
      )}
      {currentPage === 'projects' && !openProjectId && (
        <ProjectsPage
          onOpenProject={handleOpenProject}
          onToggleSidebar={toggleSidebar}
        />
      )}
      {currentPage === 'projects' && openProjectId && (
        <ProjectDetail
          projectId={openProjectId}
          onBack={() => setOpenProjectId(null)}
          onToggleSidebar={toggleSidebar}
        />
      )}
      {currentPage === 'tasks' && (
        <MyTasksPage
          onOpenProject={handleOpenProject}
          onToggleSidebar={toggleSidebar}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
