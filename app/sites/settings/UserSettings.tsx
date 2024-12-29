'use client'

import { useState, useEffect, FormEvent } from "react"
import { Card } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { ScrollArea } from "@/app/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { config } from "@/app/lib/config"
import { toast } from 'sonner'

type User = {
  uid: string
  title: string | null
  first_name: string | null
  surname: string | null
  email: string | null
  username: string | null
  cell_no: string | null
}

interface UpdateUserPayload {
  title: string
  firstName: string
  lastName: string
  username: string
  email: string
  phone: string
}

type Role = {
  uid: string
  role_name: string
  description: string | null
}

export function UserSettings() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UpdateUserPayload>({
    title: '',
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: ''
  })
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [userRoles, setUserRoles] = useState<Role[]>([])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/settings/users')
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        setUsers(data)
      } catch (error) {
        console.error('Failed to fetch users:', error)
      }
    }

    fetchUsers()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        title: selectedUser.title || '',
        firstName: selectedUser.first_name || '',
        lastName: selectedUser.surname || '',
        username: selectedUser.username || '',
        email: selectedUser.email || '',
        phone: selectedUser.cell_no || ''
      })
    }
  }, [selectedUser])

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/settings/users/roles')
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        setAvailableRoles(data)
      } catch (error) {
        console.error('Failed to fetch roles:', error)
        toast.error('Failed to fetch available roles')
      }
    }

    fetchRoles()
  }, [])

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!selectedUser) return

      try {
        const response = await fetch(`/api/settings/users/${selectedUser.uid}/roles`)
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        setUserRoles(data)
      } catch (error) {
        console.error('Failed to fetch user roles:', error)
        toast.error('Failed to fetch user roles')
      }
    }

    fetchUserRoles()
  }, [selectedUser])

  const handleFieldChange = (field: keyof UpdateUserPayload, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedUser) return

    console.log('Sending update:', formData)

    try {
      const res = await fetch(`/api/settings/users/${selectedUser.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errData = await res.json()
        console.error('Failed to update user:', errData.error)
        return
      }

      const updated = await res.json()
      console.log('User updated successfully:', updated)

      setUsers(prev =>
        prev.map(user => 
          user.uid === selectedUser.uid 
            ? {
                ...user,
                title: updated.title,
                first_name: updated.first_name,
                surname: updated.surname,
                email: updated.email,
                username: updated.username,
                cell_no: updated.cell_no
              }
            : user
        )
      )

      setSelectedUser(null)
    } catch (error) {
      console.error('Error while updating user:', error)
    }
  }

  const handleResetPassword = () => {
    // TODO: Implement reset password functionality
    console.log('Reset Password button clicked!')
  }

  const handleRoleChange = async (roleId: string, action: 'add' | 'remove') => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/settings/users/${selectedUser.uid}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roleIds: [roleId], 
          action 
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setUserRoles(data)
      toast.success(`Role ${action === 'add' ? 'added' : 'removed'} successfully`)
    } catch (error) {
      console.error('Failed to update user roles:', error)
      toast.error('Failed to update user roles')
    }
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
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <Select 
                      value={formData.title}
                      onValueChange={(value) => handleFieldChange('title', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select title" />
                      </SelectTrigger>
                      <SelectContent>
                        {config.titles.map((title) => (
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
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleFieldChange('firstName', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleFieldChange('lastName', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Username and Reset Password */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Username<span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleFieldChange('username', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Reset Password
                    </label>
                    <Button
                      variant="outline"
                      type="button"
                      className="mt-1"
                      onClick={handleResetPassword}
                    >
                      Reset Password
                    </Button>
                  </div>
                </div>

                {/* User Role */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      User Role
                    </label>
                    <Select defaultValue="">
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="cellNumber" className="block text-sm font-medium text-gray-700">
                      Cell Number
                    </label>
                    <Input
                      id="cellNumber"
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <Input
                      id="emailAddress"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className="mt-1"
                      type="email"
                    />
                  </div>
                </div>
              </form>
            </Card>

            {/* User Roles Card */}
            <Card className="p-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">User Roles</h3>
                
                {/* Current Roles Section */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Current Roles</h4>
                  {userRoles.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No roles assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {userRoles.map((role) => (
                        <div 
                          key={role.uid}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                        >
                          <div>
                            <span className="font-medium">{role.role_name}</span>
                            {role.description && (
                              <p className="text-sm text-gray-500">{role.description}</p>
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRoleChange(role.uid, 'remove')}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Roles Section */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Available Roles</h4>
                  <div className="space-y-2">
                    {availableRoles
                      .filter(role => !userRoles.some(ur => ur.uid === role.uid))
                      .map((role) => (
                        <div 
                          key={role.uid}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border"
                        >
                          <div>
                            <span className="font-medium">{role.role_name}</span>
                            {role.description && (
                              <p className="text-sm text-gray-500">{role.description}</p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChange(role.uid, 'add')}
                          >
                            Add Role
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button type="submit" onClick={handleSaveUser}>Save Changes</Button>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Back to User List
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">User List</h2>
            {users.map((user) => (
              <Card key={user.uid} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {user.first_name} {user.surname}
                    </h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <Button onClick={() => setSelectedUser(user)}>Edit</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}