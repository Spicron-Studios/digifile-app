'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Button } from "@/app/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"

export function UserCreationForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [signature, setSignature] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSignature(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const passwordsMatch = password === confirmPassword
  const passwordRequirements = [
    'At least 8 characters long',
    'Contains at least one uppercase letter',
    'Contains at least one number',
    'Contains at least one special character'
  ]

  return (
    <div className="space-y-6 p-4">
      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Select>
            <SelectTrigger id="title">
              <SelectValue placeholder="Select title" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mr">Mr</SelectItem>
              <SelectItem value="mrs">Mrs</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="initials">Initials</Label>
          <Input id="initials" placeholder="Enter initials" />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid gap-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" placeholder="Enter first name" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" placeholder="Enter last name" />
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid gap-2">
          <Label htmlFor="hpcsa">HPCSA</Label>
          <Input id="hpcsa" placeholder="Enter HPCSA number" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cellNumber">Cell Number</Label>
          <Input id="cellNumber" placeholder="Enter cell number" />
        </div>
      </div>

      {/* Row 4 */}
      <div className="grid gap-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" placeholder="Enter username" />
      </div>

      {/* Row 5 */}
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input 
          id="password" 
          type="password" 
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <ul className="text-sm text-muted-foreground ml-2 list-disc list-inside">
          {passwordRequirements.map((req, index) => (
            <li key={index}>{req}</li>
          ))}
        </ul>
      </div>

      {/* Row 6 */}
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Re-enter Password</Label>
        <Input 
          id="confirmPassword" 
          type="password" 
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {confirmPassword && (
          <p className={`text-sm ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
            {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
          </p>
        )}
      </div>

      {/* Row 7 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="grid gap-2">
          <Label>Signature</Label>
          <div className="border rounded-lg h-32 flex items-center justify-center bg-muted">
            {signature ? (
              <Image
                src={signature}
                alt="Signature"
                width={200}
                height={100}
                className="object-contain"
              />
            ) : (
              <p className="text-muted-foreground">No signature uploaded</p>
            )}
          </div>
        </div>
        <div className="grid gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            Upload Signature
          </Button>
        </div>
      </div>
    </div>
  )
}

