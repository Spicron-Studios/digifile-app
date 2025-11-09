'use client';
import { getLogger } from '@/app/lib/logger';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { ListSkeleton } from '@/app/components/ui/skeletons';
import { toast } from 'sonner';
import { generatePublicIntakeLink } from '@/app/actions/patients';

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
  const [intakeLink, setIntakeLink] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

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
        <div className="flex items-center gap-3">
          <div>Welcome, {session?.user?.name}</div>
          <Button
            variant="outline"
            onClick={async () => {
              setIsGenerating(true);
              setIntakeLink('');
              try {
                const res = await generatePublicIntakeLink(
                  window.location.origin
                );
                if ('error' in res) {
                  toast.error(res.error);
                } else {
                  setIntakeLink(res.url);
                  toast.success('Expiring intake link generated');
                }
              } catch {
                toast.error('Failed to generate link');
              } finally {
                setIsGenerating(false);
              }
            }}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating…' : 'Generate Intake Test Link'}
          </Button>
        </div>
      </div>

      {intakeLink && (
        <div className="mb-6 p-4 border rounded">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">Intake Link (24h):</span>
            <Link
              href={intakeLink}
              className="text-indigo-600 hover:text-indigo-900"
              target="_blank"
            >
              {intakeLink}
            </Link>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(intakeLink);
                  toast.success('Link copied');
                } catch (_error) {
                  toast.error('Failed to copy link');
                }
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      )}

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
