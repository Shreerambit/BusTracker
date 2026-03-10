import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing
const DEMO_USERS: Record<string, User> = {
  'admin@school.com': {
    id: 'admin-1',
    email: 'admin@school.com',
    name: 'Administrator',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  'driver@school.com': {
    id: 'driver-1',
    email: 'driver@school.com',
    name: 'John Driver',
    role: 'driver',
    busId: 'bus-1',
    createdAt: new Date().toISOString()
  },
  'student@school.com': {
    id: 'student-1',
    email: 'student@school.com',
    name: 'Alice Student',
    role: 'student',
    stopId: 'stop-1',
    routeId: 'route-1',
    createdAt: new Date().toISOString()
  },
  'parent@school.com': {
    id: 'parent-1',
    email: 'parent@school.com',
    name: 'Bob Parent',
    role: 'parent',
    studentIds: ['student-1'],
    createdAt: new Date().toISOString()
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('busTrackerUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    // Demo authentication - in production, use Firebase Auth
    const demoUser = DEMO_USERS[email];
    if (demoUser && demoUser.role === role) {
      setUser(demoUser);
      localStorage.setItem('busTrackerUser', JSON.stringify(demoUser));
    } else {
      // For demo, auto-create user if not exists
      const newUser: User = {
        id: `${role}-${Date.now()}`,
        email,
        name: email.split('@')[0],
        role,
        createdAt: new Date().toISOString()
      };
      setUser(newUser);
      localStorage.setItem('busTrackerUser', JSON.stringify(newUser));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('busTrackerUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
