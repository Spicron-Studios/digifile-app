'use client';

import { useState, useEffect } from 'react';
import { getSessionData } from '@/app/actions/auth';
import type { Session } from 'next-auth';
import { config } from '@/app/lib/config';

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const data = await getSessionData();

        if (!data) {
          setSession(null);
          return;
        }

        const sessionData: Session | null = {
          expires: new Date(Date.now() + config.sessionTimeout).toISOString(),
          user: {
            id: 'current-user', // TODO: Get actual user ID from auth data
            orgId: data.user.orgId,
            roles: data.user.roles || [],
            name: data.user.name || null,
            email: data.user.email || null,
          },
        };
        setSession(sessionData);
      } catch (error) {
        console.error('Error loading session:', error);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  return {
    session,
    isLoading,
  };
};
