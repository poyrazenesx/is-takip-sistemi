'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';
import { users } from '@/lib/data';

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return <Dashboard users={users} />;
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
