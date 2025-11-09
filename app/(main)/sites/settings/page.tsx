'use client';

import { useSession } from 'next-auth/react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import { GeneralSettings } from './GeneralSettings';
import { UserSettings } from './UserSettings';
import { DebitOrderSettings } from './DebitOrderSettings';

export default function SettingsPage() {
  const { data: session } = useSession();

  // Helper function to check if user has org-admin level access
  const hasAdminAccess = (() => {
    const role = session?.user?.role;
    const name = role?.name?.toLowerCase();
    return name === 'admin' || name === 'organizer' || name === 'superuser';
  })();

  // If user doesn't have admin access, they can only see user settings
  const defaultTab = hasAdminAccess ? 'general' : 'users';

  return (
    <div className="h-full">
      <Tabs defaultValue={defaultTab} className="flex h-full">
        <div className="w-64 border-r bg-gray-50">
          <TabsList className="flex h-full w-full flex-col items-stretch gap-1 bg-transparent p-2">
            {hasAdminAccess && (
              <TabsTrigger
                value="general"
                className="justify-start data-[state=active]:bg-white"
              >
                General
              </TabsTrigger>
            )}
            <TabsTrigger
              value="users"
              className="justify-start data-[state=active]:bg-white"
            >
              Users
            </TabsTrigger>
            {hasAdminAccess && (
              <TabsTrigger
                value="debit-order"
                className="justify-start data-[state=active]:bg-white"
              >
                Debit Order
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <div className="flex-1">
          {hasAdminAccess && (
            <TabsContent value="general" className="h-full m-0 border-0">
              <GeneralSettings />
            </TabsContent>
          )}

          <TabsContent value="users" className="h-full m-0 border-0">
            <UserSettings />
          </TabsContent>

          {hasAdminAccess && (
            <TabsContent value="debit-order" className="h-full m-0 border-0">
              <DebitOrderSettings />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
