'use client';
import { getLogger } from '@/app/lib/logger';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ListSkeleton } from '@/app/components/ui/skeletons';

export default function SitesPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login/signin');
    },
  });
  const [usernames, setUsernames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api', {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        const names = data
          .map((user: { username: string }) => user.username)
          .filter(Boolean);
        setUsernames(names);
      } catch (error) {
        const logger = getLogger();
        await logger.error(
          'app/(main)/sites/page.tsx',
          `Error fetching users: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchUsers();
    }
  }, [status]);

  if (status === 'loading' || isLoading) {
    return <ListSkeleton items={5} />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <div>Welcome, {session?.user?.name}</div>
      </div>

      {usernames.length > 0 ? (
        <ul className="space-y-2">
          {usernames.map((username, index) => (
            <li key={index} className="p-3 bg-white rounded shadow">
              {username}
            </li>
          ))}
        </ul>
      ) : (
        <p>No users found.</p>
      )}
    </div>
  );
}
