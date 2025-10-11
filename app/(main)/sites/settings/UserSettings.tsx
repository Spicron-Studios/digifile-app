'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { config } from '@/app/lib/config';
import { toast } from 'sonner';
import {
  getUsers,
  updateUser,
  getAvailableRoles,
  getUserRole,
  updateUserRole,
} from '@/app/actions/users';
import { handleResult } from '@/app/utils/helper-functions/handle-results';
import { UserSettingsSkeleton } from '@/app/components/ui/skeletons';

type User = {
  uid: string;
  title: string | null;
  first_name: string | null;
  surname: string | null;
  email: string | null;
  username: string | null;
  cell_no: string | null;
  role_id: string | null;
};

interface UpdateUserPayload {
  title: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
}

type Role = {
  uid: string;
  role_name: string;
  description: string | null;
};

export function UserSettings() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UpdateUserPayload>({
    title: '',
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
  });
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [userRole, setUserRole] = useState<Role | null>(null);

  const isAdmin = session?.user?.roles?.some(
    r => r.role.name.toLowerCase() === 'admin'
  );
  const isOrganizer = session?.user?.roles?.some(
    r => r.role.name.toLowerCase() === 'organizer'
  );
  const isSuperUser = session?.user?.roles?.some(
    r => r.role.name.toLowerCase() === 'superuser'
  );

  const hasRoleManagementAccess = (
    roles: { role: { uid: string; name: string } }[]
  ) => {
    return roles?.some(r => {
      const name = r.role.name.toLowerCase();
      return name === 'admin' || name === 'organizer' || name === 'superuser';
    });
  };

  // Fetch users effect
  useEffect(() => {
    const fetchUsersAction = async () => {
      if (status !== 'authenticated') return;
      try {
        setIsLoading(true);
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch users:', error);
        }
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchUsersAction();
  }, [status]);

  // Fetch roles effect
  useEffect(() => {
    const fetchUserData = async () => {
      if (!selectedUser) return;

      const [rolesResult, userRoleResult] = await Promise.all([
        handleResult(getAvailableRoles()),
        handleResult(getUserRole(selectedUser.uid)),
      ]);

      if (rolesResult.error || userRoleResult.error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(
            'Failed to fetch role data:',
            rolesResult.error || userRoleResult.error
          );
        }
        toast.error('Failed to load role information');
        setUserRole(null);
        return;
      }

      setAvailableRoles(rolesResult.data || []);
      setUserRole(userRoleResult.data || null);
    };

    fetchUserData();
  }, [selectedUser]);

  // Update form data effect
  useEffect(() => {
    if (selectedUser) {
      setFormData({
        title: selectedUser.title || '',
        firstName: selectedUser.first_name || '',
        lastName: selectedUser.surname || '',
        username: selectedUser.username || '',
        email: selectedUser.email || '',
        phone: selectedUser.cell_no || '',
      });
    }
  }, [selectedUser]);

  const handleFieldChange = (field: keyof UpdateUserPayload, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveUser = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!selectedUser) return;

    const { data: updated, error } = await handleResult(
      updateUser(selectedUser.uid, formData)
    );

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error while updating user:', error);
      }
      toast.error('Failed to update user');
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('User updated successfully:', updated);
    }

    setUsers(prev =>
      prev.map(user =>
        user.uid === selectedUser.uid
          ? {
              ...user,
              title: updated?.title ?? user.title,
              first_name: updated?.firstName ?? user.first_name,
              surname: updated?.surname ?? user.surname,
              email: updated?.email ?? user.email,
              username: updated?.username ?? user.username,
              cell_no: updated?.cellNo ?? user.cell_no,
            }
          : user
      )
    );

    setSelectedUser(null);
  };

  const handleResetPassword = () => {
    // TODO: Implement reset password functionality
    if (process.env.NODE_ENV === 'development') {
      console.log('Reset Password button clicked!');
    }
  };

  const handleRoleChange = async (roleId: string) => {
    if (!selectedUser) return;

    try {
      const { data: updatedRole } = await handleResult(
        updateUserRole(selectedUser.uid, roleId)
      );

      if (updatedRole) {
        setUserRole(updatedRole);
        toast.success('Role updated successfully');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update user role:', error);
      }
      toast.error('Failed to update user role');
    }
  };

  if (status === 'loading' || isLoading) {
    return <UserSettingsSkeleton />;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Please sign in to access user settings</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        {selectedUser ? (
          <div className="space-y-6">
            {/* User Details Card */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                Edit User: {selectedUser.first_name} {selectedUser.surname}
              </h2>
              <form onSubmit={handleSaveUser} className="space-y-6">
                {/* Title and Name Fields */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Title
                    </label>
                    <Select
                      value={formData.title}
                      onValueChange={value => handleFieldChange('title', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select title" />
                      </SelectTrigger>
                      <SelectContent>
                        {config.titles.map(title => (
                          <SelectItem key={title.value} value={title.value}>
                            {title.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* First Name and Last Name */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={e =>
                        handleFieldChange('firstName', e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={e =>
                        handleFieldChange('lastName', e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Username and Reset Password */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Username<span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={e =>
                        handleFieldChange('username', e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Reset Password
                    </label>
                    <button
                      type="button"
                      className="mt-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                      onClick={() => handleResetPassword()}
                    >
                      Reset Password
                    </button>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="cellNumber"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Cell Number
                    </label>
                    <Input
                      id="cellNumber"
                      value={formData.phone}
                      onChange={e => handleFieldChange('phone', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="emailAddress"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email Address
                    </label>
                    <Input
                      id="emailAddress"
                      value={formData.email}
                      onChange={e => handleFieldChange('email', e.target.value)}
                      className="mt-1"
                      type="email"
                    />
                  </div>
                </div>
              </form>
            </Card>

            {selectedUser &&
              hasRoleManagementAccess(session?.user?.roles ?? []) && (
                <Card className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">User Role</h3>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Select Role
                      </label>
                      <Select
                        value={userRole?.uid || ''}
                        onValueChange={handleRoleChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map(role => (
                            <SelectItem key={role.uid} value={role.uid}>
                              {role.role_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {userRole && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                          <div>
                            <span className="font-medium">
                              Current Role: {userRole.role_name}
                            </span>
                            {userRole.description && (
                              <p className="text-sm text-gray-500 mt-1">
                                {userRole.description}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <button
                type="submit"
                onClick={() => {
                  handleSaveUser();
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Save Changes
              </button>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Back to User List
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User List</h2>
              {(isAdmin || isOrganizer || isSuperUser) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    /* TODO: Add new user */
                  }}
                >
                  Add User
                </Button>
              )}
            </div>
            {users.map(user => (
              <Card key={user.uid} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {user.first_name} {user.surname}
                    </h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <Button
                    onClick={() => setSelectedUser(user)}
                    disabled={
                      !isAdmin &&
                      !isOrganizer &&
                      !isSuperUser &&
                      user.uid !== session?.user?.id
                    }
                  >
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
