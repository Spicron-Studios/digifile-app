'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Button } from "@/app/components/ui/button"
import { PracticeInfoForm } from './practice-info-form'
import { ContactDetailsForm } from './contact-details-form'
import { UserCreationForm } from './user-creation-form'
import { ExtraInfoForm } from './extra-info-form'
import { VerificationModal } from './components/verification-modal'

interface FormData {
  practiceName: string;
  // Add other form fields here
}

export default function RegistrationPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("practice-info")
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    practiceName: '',
  })
  
  const tabs = [
    { id: "practice-info", label: "Practice Info" },
    { id: "contact-details", label: "Contact Details" },
    { id: "user-creation", label: "User Creation" },
    { id: "extra-info", label: "Extra Info" },
  ]

  const isLastTab = activeTab === tabs[tabs.length - 1].id
  const isFormValid = formData.practiceName.trim() !== ''

  const handleNext = () => {
    if (isLastTab) {
      if (isFormValid) {
        setShowVerificationModal(true)
      } else {
        // Highlight the Practice Info tab
        setActiveTab("practice-info")
      }
    } else {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab)
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1].id)
      }
    }
  }

  const handlePrevious = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id)
    }
  }

  const handleCancel = () => {
    router.push('/')
  }

  const handleVerificationSubmit = () => {
    // TODO: Handle final form submission
    setShowVerificationModal(false)
    router.push('/success') // Or wherever you want to redirect after successful submission
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className={
                tab.id === "practice-info" && !isFormValid && activeTab === "extra-info"
                  ? "border-red-500 border-2"
                  : ""
              }
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="practice-info">
          <PracticeInfoForm 
            value={formData.practiceName}
            onChange={(value) => setFormData(prev => ({ ...prev, practiceName: value }))}
          />
        </TabsContent>
        <TabsContent value="contact-details">
          <ContactDetailsForm />
        </TabsContent>
        <TabsContent value="user-creation">
          <UserCreationForm />
        </TabsContent>
        <TabsContent value="extra-info">
          <ExtraInfoForm />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="destructive" onClick={handleCancel}>
          Cancel
        </Button>
        <Button 
          variant="secondary" 
          onClick={handlePrevious}
          disabled={activeTab === tabs[0].id}
        >
          Previous
        </Button>
        <Button 
          onClick={handleNext}
          disabled={isLastTab && !isFormValid}
        >
          {isLastTab ? 'Finish' : 'Next'}
        </Button>
      </div>

      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onSubmit={handleVerificationSubmit}
      />
    </div>
  )
}

