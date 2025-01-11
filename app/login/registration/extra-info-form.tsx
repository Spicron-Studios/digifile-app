'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from "@/app/components/ui/button"
import { ConsentRow } from './components/consent-row'

interface ConsentFile {
  content: string | null
}

interface ExtraInfoFormProps {
  value: {
    logo: string | null;
    consents: { content: string | null }[];
  };
  onChange: (value: ExtraInfoFormProps['value']) => void;
}

export function ExtraInfoForm({ value, onChange }: ExtraInfoFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onChange({
          ...value,
          logo: reader.result as string,
        });
      }
      reader.readAsDataURL(file)
    }
  }

  const handleConsentUpload = (index: number) => async (file: File) => {
    const text = await file.text()
    const updatedConsents = [...value.consents]
    updatedConsents[index] = { content: text }
    onChange({
      ...value,
      consents: updatedConsents,
    });
  }

  return (
    <div className="space-y-8 p-4">
      {/* Logo Section */}
      <div className="flex justify-end items-center gap-4">
        <div className="h-32 w-32 border rounded-lg flex items-center justify-center bg-muted">
          {value.logo ? (
            <Image
              src={value.logo}
              alt="Practice Logo"
              width={120}
              height={120}
              className="object-contain"
            />
          ) : (
            <p className="text-muted-foreground text-sm">No logo uploaded</p>
          )}
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLogoUpload}
            accept="image/*"
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
          >
            {value.logo ? 'Change Logo' : 'Upload Logo'}
          </Button>
        </div>
      </div>

      {/* Consent Sections */}
      <div className="space-y-6">
        {value.consents.map((consent, index) => (
          <ConsentRow
            key={index}
            number={index + 1}
            content={consent.content}
            onUpload={handleConsentUpload(index)}
          />
        ))}
      </div>
    </div>
  )
}

