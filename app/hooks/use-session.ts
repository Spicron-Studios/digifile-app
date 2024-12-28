'use client'

import { useState, useEffect } from 'react'
import { getSessionData } from '@/app/actions/auth'
import type { Session } from '@/app/types/next-auth'

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSession = async () => {
      try {
        const data = await getSessionData()
        setSession(data)
      } catch (error) {
        console.error('Error loading session:', error)
        setSession(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [])

  return {
    session,
    isLoading
  }
} 