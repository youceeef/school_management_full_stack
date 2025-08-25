'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const router = useRouter();
  const { hasRole, loading } = useAuth();

  useEffect(() => {
    if (!loading && !hasRole('admin')) {
      router.push('/dashboard');
    }
  }, [loading, hasRole, router]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  // Only render children if user has admin role
  return hasRole('admin') ? children : null;
};

export default AdminRoute; 