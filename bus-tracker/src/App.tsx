import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Login } from '@/pages/Login';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { DriverApp } from '@/pages/DriverApp';
import { StudentApp } from '@/pages/StudentApp';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'driver':
      return <DriverApp />;
    case 'student':
    case 'parent':
      return <StudentApp />;
    default:
      return <Login />;
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
