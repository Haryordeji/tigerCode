import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { getDiagnosticProgress } from '../services/dataService';

interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  diagnosticCompleted: boolean;
  checkingDiagnostic: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  googleLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagnosticCompleted, setDiagnosticCompleted] = useState(false);
  const [checkingDiagnostic, setCheckingDiagnostic] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Check diagnostic status when user logs in
  useEffect(() => {
    const checkDiagnosticStatus = async () => {
      if (user) {
        try {
          setCheckingDiagnostic(true);
          const diagnosticProgress = await getDiagnosticProgress();
          setDiagnosticCompleted(diagnosticProgress.diagnosticCompleted);
        } catch (error) {
          console.error('Failed to check diagnostic status:', error);
          // Default to false if there's an error
          setDiagnosticCompleted(false);
        } finally {
          setCheckingDiagnostic(false);
        }
      }
    };
  
    checkDiagnosticStatus();
  }, [user]);

  const baseUrl = import.meta.env.VITE_API_URL || ''

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      setUser(data.data);
    } catch (error) {
      localStorage.removeItem('token');
      setError('Session expired. Please login again.');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.data.token);
      setUser(data.data);
      
      // Check diagnostic status after login
      try {
        const diagnosticProgress = await getDiagnosticProgress();
        setDiagnosticCompleted(diagnosticProgress.diagnosticCompleted);
      } catch (error) {
        console.error('Failed to check diagnostic status:', error);
        setDiagnosticCompleted(false);
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.data.token);
      setUser(data.data);
      
      // New users have not completed the diagnostic
      setDiagnosticCompleted(false);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Remove token
    localStorage.removeItem('token');
    setUser(null);
    setDiagnosticCompleted(false);
    
    try {
      fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).catch(() => {
        console.error('Failed to logout');
      });
    } catch (e) {
      console.error('Error during logout:', e);
    }
    
    window.location.href = '/';
  };

  const googleLogin = () => {
    window.location.href = `${baseUrl}/api/auth/google`;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      diagnosticCompleted, 
      checkingDiagnostic,
      login, 
      register, 
      logout, 
      googleLogin 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};