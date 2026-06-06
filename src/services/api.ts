// API Base URL - Pointed directly to your live Railway production server
const API_BASE = import.meta.env.VITE_API_URL || 'https://taskflow-production-c777.up.railway.app/api';

// Token storage
const TOKEN_KEY = 'taskflow_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// API request helper
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// ========================
// AUTH API
// ========================
export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  token: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export const authAPI = {
  signup: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () =>
    request<{ user: User }>('/auth/me'),

  searchUser: (email: string) =>
    request<{ user: User }>(`/auth/users/search?email=${encodeURIComponent(email)}`),
};

// ========================
// PROJECTS API
// ========================
export interface ProjectMember {
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdBy: { id: string; name: string; email: string } | string;
  members: ProjectMember[];
  taskCount: number;
  doneCount: number;
  progress: number;
  role: 'admin' | 'member';
  createdAt: string;
  updatedAt: string;
}

export const projectsAPI = {
  getAll: () =>
    request<Project[]>('/projects'),

  getById: (id: string) =>
    request<Project>(`/projects/${id}`),

  create: (name: string, description: string) =>
    request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  update: (id: string, data: { name?: string; description?: string }) =>
    request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    }),

  addMember: (projectId: string, email: string, role: 'admin' | 'member') =>
    request<{ members: ProjectMember[] }>(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),

  updateMemberRole: (projectId: string, userId: string, role: 'admin' | 'member') =>
    request<{ members: ProjectMember[] }>(`/projects/${projectId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  removeMember: (projectId: string, userId: string) =>
    request<{ members: ProjectMember[] }>(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    }),
};

// ========================
// TASKS API
// ========================
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
  overdue: number;
  highPriority: number;
  allProjectTasks: number;
}

export const tasksAPI = {
  getMyTasks: () =>
    request<Task[]>('/tasks/my'),

  getProjectTasks: (projectId: string) =>
    request<Task[]>(`/tasks/project/${projectId}`),

  getStats: () =>
    request<TaskStats>('/tasks/stats'),

  getById: (id: string) =>
    request<Task>(`/tasks/${id}`),

  create: (data: {
    projectId: string;
    title: string;
    description?: string;
    priority?: TaskPriority;
    assigneeId?: string | null;
    dueDate?: string | null;
  }) =>
    request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string | null;
    dueDate?: string | null;
  }) =>
    request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    }),
};