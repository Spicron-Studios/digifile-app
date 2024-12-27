'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog"

export default function SigninPage() {
  const router = useRouter()
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [formData, setFormData] = useState({
    bfhNumber: '',
    username: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement Next-Auth authentication logic here
  }

  return (
    <div className="container mx-auto max-w-md mt-20 p-6">
      {/* Logo */}
      <Link href="/" className="block mb-12 text-3xl font-bold">
        <span className="text-blue-600">Digi</span>File
      </Link>

      {/* Sign In Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          placeholder="BFH Number"
          value={formData.bfhNumber}
          onChange={(e) => setFormData(prev => ({ ...prev, bfhNumber: e.target.value }))}
        />
        
        <Input
          placeholder="Username"
          value={formData.username}
          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
        />
        
        <Input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
        />

        <Button type="submit" className="w-full">
          Login
        </Button>
      </form>

      {/* Links */}
      <div className="mt-6 flex justify-between text-sm">
        <Link 
          href="/login/registration" 
          className="text-green-600 hover:underline"
        >
          Register
        </Link>
        <button
          onClick={() => setShowForgotPassword(true)}
          className="text-purple-600 hover:underline"
        >
          Forgot Password
        </button>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          {/* TODO: Implement forgot password form */}
        </DialogContent>
      </Dialog>
    </div>
  )
}