import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User, LoginCredentials, RegisterCredentials } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      api.setToken(token);
      // We don't have a /me endpoint, so we just assume the token is valid for the demo.
      // In a real app, we would fetch the user profile here.
      setUser({ email: 'user@phytovaria.com' } as User); 
    } else {
      localStorage.removeItem('token');
      api.setToken(null);
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = async (credentials: LoginCredentials) => {
    const data = await api.login(credentials);
    setToken(data.access_token);
  };

  const register = async (credentials: RegisterCredentials) => {
    await api.register(credentials);
    await login(credentials); // Auto-login after register
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
