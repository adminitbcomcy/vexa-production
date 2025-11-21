'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { setClerkTokenGetter } from '@/lib/api/client';

export function ApiAuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    // Set the Clerk token getter for API client
    setClerkTokenGetter(() => getToken());
  }, [getToken]);

  return <>{children}</>;
}
