'use client'

import { useState, useEffect, FormEvent } from "react"
import { Upload } from 'lucide-react'
import Image from 'next/image'

import { Button } from "@/app/components/ui/button"
import { Card } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { ScrollArea } from "@/app/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { ConsentModal } from "@/app/components/ui/consent-modal"
import { config } from "@/app/lib/config"

type User = {
  uid: string
  title: string | null
  first_name: string | null
  surname: string | null
  email: string | null
  username: string | null
  cell_no: string | null
}

// Additional type for the PUT request body
interface UpdateUserPayload {
  title: string
  firstName: string
  lastName: string
  username: string
  email: string
  phone: string
}

export default function TabPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [signatureUrl, setSignatureUrl] = useState<string>("/placeholder.svg?height=100&width=200")
  const [logoUrl, setLogoUrl] = useState("/placeholder.svg?height=200&width=200")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedConsent, setSelectedConsent] = useState<number | null>(null)
  const [formData, setFormData] = useState<UpdateUserPayload>({
    title: '',
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: ''
  })

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setLogoUrl(url)
    }
  }

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setSignatureUrl(url)
    }
  }

  const handleConsentFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log(`Uploading file for consent: ${file.name}`)
    }
  }

  const openModal = (consentNumber: number) => {
    setSelectedConsent(consentNumber)
    setIsModalOpen(true)
  }

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

  return (
    <div className="flex h-screen bg-white">
      <Tabs defaultValue="general" className="flex h-full w-full">
        <div className="w-64 border-r bg-gray-50">
          <TabsList className="flex h-full w-full flex-col items-stretch gap-1 bg-transparent p-2">
            <TabsTrigger
              value="general"
              className="justify-start data-[state=active]:bg-white"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="justify-start data-[state=active]:bg-white"
            >
              Users
            </TabsTrigger>
            <TabsTrigger
              value="debit-order"
              className="justify-start data-[state=active]:bg-white"
            >
              Debit Order
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="general" className="h-full mt-0 border-0 p-0">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-4">
                <Card className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="aspect-square w-full max-w-[200px] overflow-hidden rounded-lg border">
                        <Image
                          src={logoUrl}
                          alt="Company logo"
                          width={200}
                          height={100}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          id="logo-upload"
                          className="sr-only"
                          onChange={handleImageUpload}
                        />
                        <label htmlFor="logo-upload">
                          <Button variant="outline" className="w-full" asChild>
                            <span>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Logo
                            </span>
                          </Button>
                        </label>
                      </div>
                      <div className="pt-4">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Practice Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="test1">Test Value 1</SelectItem>
                            <SelectItem value="test2">Test Value 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="practice-name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Practice Name
                        </label>
                        <Input id="practice-name" className="mt-1" />
                      </div>
                      <div>
                        <label
                          htmlFor="bhf-number"
                          className="block text-sm font-medium text-gray-700"
                        >
                          BHF Number
                        </label>
                        <Input id="bhf-number" className="mt-1" />
                      </div>
                      <div className="pt-4">
                        <label
                          htmlFor="vat-number"
                          className="block text-sm font-medium text-gray-700"
                        >
                          VAT No.
                        </label>
                        <Input id="vat-number" className="mt-1" />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="address-physical"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Address Physical
                        </label>
                        <Input id="address-physical" className="mt-1" />
                      </div>
                      <div>
                        <label
                          htmlFor="practice"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Practice
                        </label>
                        <Input id="practice" className="mt-1" />
                      </div>
                      <div>
                        <label
                          htmlFor="cell-number"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Cell Number
                        </label>
                        <Input id="cell-number" type="tel" className="mt-1" />
                      </div>
                      <div>
                        <label
                          htmlFor="fax"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Fax
                        </label>
                        <Input id="fax" className="mt-1" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="postal-address"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Postal Address
                        </label>
                        <Input id="postal-address" className="mt-1" />
                      </div>
                      <div>
                        <label
                          htmlFor="accounts"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Accounts
                        </label>
                        <Input id="accounts" className="mt-1" />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Email
                        </label>
                        <Input id="email" type="email" className="mt-1" />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="space-y-4">
                    {[1, 2, 3].map((consentNumber) => (
                      <div key={consentNumber} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Consent {consentNumber}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => openModal(consentNumber)}
                          >
                            View
                          </Button>
                          <div>
                            <input
                              type="file"
                              accept=".txt"
                              id={`consent-${consentNumber}-upload`}
                              className="sr-only"
                              onChange={handleConsentFileUpload}
                            />
                            <label htmlFor={`consent-${consentNumber}-upload`}>
                              <Button variant="outline" asChild>
                                <span>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload
                                </span>
                              </Button>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="users" className="h-full mt-0 border-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                {selectedUser ? (
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-6">
                      Edit User: {selectedUser.first_name} {selectedUser.surname}
                    </h2>
                    <form onSubmit={handleSaveUser} className="space-y-6">
                      {/* First Row */}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Title<span className="text-red-500">*</span>
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
                        <div>
                          <label htmlFor="initials" className="block text-sm font-medium text-gray-700">
                            Initials<span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="initials"
                            value={formData.firstName}
                            onChange={(e) => handleFieldChange('firstName', e.target.value)}
                            className="mt-1"
                            // Note: we're storing firstName in a separate field below
                          />
                        </div>
                      </div>

                      {/* Second Row */}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                            First Name<span className="text-red-500">*</span>
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
                            Last Name<span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => handleFieldChange('lastName', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {/* Third Row */}
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
                        {/* Instead of Password input, we place a Reset Password Button */}
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

                      {/* Fourth Row: Ignore the roles for now, but keep the structure */}
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

                      {/* Fifth Row - HPCSA or cell number, etc. Add phone field here */}
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

                      {/* Action Buttons */}
                      <div className="flex justify-between pt-4">
                        <Button type="submit">Save Changes</Button>
                        <Button variant="outline" onClick={() => setSelectedUser(null)}>
                          Back to User List
                        </Button>
                      </div>
                    </form>
                  </Card>
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
          </TabsContent>

          <TabsContent value="debit-order" className="h-full mt-0 border-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <h2 className="text-2xl font-bold mb-4">Debit Order</h2>
                <p className="text-gray-600">Debit order content goes here.</p>
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>

      {selectedConsent && (
        <ConsentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          consentNumber={selectedConsent}
        />
      )}
    </div>
  )
}

