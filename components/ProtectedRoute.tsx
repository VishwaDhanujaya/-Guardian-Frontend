import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { ReactNode, useEffect } from 'react';

export default function ProtectedRoute({
  children,
  officerOnly = false,
}: {
  children: ReactNode;
  officerOnly?: boolean;
}) {
  const { session, isOfficer } = useAuth();

  useEffect(() => {
    if (!session) {
      router.replace('/login');
    } else if (officerOnly && !isOfficer) {
      router.replace('/home');
    }
  }, [session, isOfficer, officerOnly]);

  if (!session) return null;
  if (officerOnly && !isOfficer) return null;

  return <>{children}</>;
}
