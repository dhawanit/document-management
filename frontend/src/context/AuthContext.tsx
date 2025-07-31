import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  canTriggerIngestion?: boolean;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load user & token from localStorage on app start
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Login: save token & user to both state and localStorage
  const login = (token: string, userData: User) => {
    setToken(token);
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // ✅ Logout: clear state & localStorage
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};