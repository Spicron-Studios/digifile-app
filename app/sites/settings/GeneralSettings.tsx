'use client'

import { useState } from "react"
import { Upload } from "lucide-react"
import Image from "next/image"
import { Button } from "@/app/components/ui/button"
import { Card } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { ScrollArea } from "@/app/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { ConsentModal } from "@/app/components/ui/consent-modal"

export function GeneralSettings() {
  const [logoUrl, setLogoUrl] = useState("/placeholder.svg?height=200&width=200")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedConsent, setSelectedConsent] = useState<number | null>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setLogoUrl(url)
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

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {/* Organization Info Card */}
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

        {/* Contact Details Card */}
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

        {/* Consent Documents Card */}
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

      {selectedConsent && (
        <ConsentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          consentNumber={selectedConsent}
        />
      )}
    </ScrollArea>
  )
}