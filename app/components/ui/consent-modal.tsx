'use client'

import { X } from 'lucide-react'

import { Button } from "@/app/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog"

interface ConsentModalProps {
  isOpen: boolean
  onClose: () => void
  consentNumber: number
}

export function ConsentModal({ isOpen, onClose, consentNumber }: ConsentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Consent {consentNumber}</DialogTitle>
          <Button
            variant="ghost"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        <DialogDescription className="text-center py-4">
          Under Construction
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}

