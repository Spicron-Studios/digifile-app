'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { ScrollArea } from './scroll-area'

type ConsentModalProps = {
  isOpen: boolean
  onClose: () => void
  consentNumber: number
  orgId: string
}

export function ConsentModal({ isOpen, onClose, consentNumber, orgId }: ConsentModalProps) {
  const [content, setContent] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchConsentContent = async () => {
      if (!isOpen) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/settings/organization/${orgId}/consent/${consentNumber}`)
        if (!response.ok) {
          throw new Error('Failed to fetch consent document')
        }
        
        const text = await response.text()
        setContent(text)
      } catch (error) {
        console.error('Error fetching consent content:', error)
        setError('Failed to load consent document')
      } finally {
        setIsLoading(false)
      }
    }

    fetchConsentContent()
  }, [isOpen, consentNumber, orgId])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Consent Document {consentNumber}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] w-full p-4">
          {isLoading ? (
            <div className="flex justify-center">Loading...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <pre className="whitespace-pre-wrap font-sans">{content}</pre>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

