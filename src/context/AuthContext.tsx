import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { authAPI, getToken, setToken, removeToken, type User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const { user } = await authAPI.getMe();
          setUser(user);
        } catch {
          removeToken();
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user, token } = await authAPI.login(email, password);
    setToken(token);
    setUser(user);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const { user, token } = await authAPI.signup(name, email, password);
    setToken(token);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
