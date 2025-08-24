'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/app/components/ui/button';
import { PracticeInfoForm } from './practice-info-form';
import { ContactDetailsForm } from './contact-details-form';
import { UserCreationForm } from './user-creation-form';
import { ExtraInfoForm } from './extra-info-form';
import { VerificationModal } from './components/verification-modal';
import { registerOrganization } from '@/app/actions/register';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import type { PracticeType } from '@/app/actions/practice-types';

const practiceInfoSchema = z.object({
  practiceName: z.string().min(1, 'Practice name is required'),
  bhfNumber: z
    .string()
    .min(1, 'BHF number is required')
    .regex(/^\d+$/, 'BHF number must contain only numbers'),
  hpcsaNumber: z.string().optional(),
  practiceType: z.string().optional(),
  vatNumber: z.string().optional(),
});

const userCreationSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

interface FormData {
  practiceInfo: z.infer<typeof practiceInfoSchema>;
  contactDetails: {
    practiceTelephone?: string;
    accountsTelephone?: string;
    postalCode?: string;
    fullAddress?: string;
    practiceEmail?: string;
    cellNumber?: string;
    fax?: string;
  };
  userCreation: {
    title?: string;
    initials?: string;
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    confirmPassword: string;
    signature: string | null;
    hpcsa?: string;
    cellNumber?: string;
  };
  extraInfo: {
    logo: string | null;
    consents: { content: string | null }[];
  };
}

function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const flattened = error.flatten();
  const entries = Object.entries(flattened.fieldErrors ?? {}).map(([k, v]) => [
    k,
    v ?? [],
  ]);
  return Object.fromEntries(entries) as Record<string, string[]>;
}

export default function RegistrationClient({
  practiceTypes,
}: {
  practiceTypes: PracticeType[];
}): React.JSX.Element {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('practice-info');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    practiceInfo: {
      practiceName: '',
      bhfNumber: '',
      hpcsaNumber: '',
      practiceType: '',
      vatNumber: '',
    },
    contactDetails: {
      practiceTelephone: '',
      accountsTelephone: '',
      postalCode: '',
      fullAddress: '',
      practiceEmail: '',
      cellNumber: '',
      fax: '',
    },
    userCreation: {
      title: '',
      initials: '',
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      confirmPassword: '',
      signature: null,
      hpcsa: '',
      cellNumber: '',
    },
    extraInfo: {
      logo: null,
      consents: [{ content: null }, { content: null }, { content: null }],
    },
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const tabs = [
    { id: 'practice-info', label: 'Practice Info' },
    { id: 'contact-details', label: 'Contact Details' },
    { id: 'user-creation', label: 'User Creation' },
    { id: 'extra-info', label: 'Extra Info' },
  ];

  const isLastTab = activeTab === tabs[tabs.length - 1]?.id;

  const isFormValid = (): boolean => {
    try {
      if (activeTab === 'practice-info' || activeTab === 'extra-info') {
        practiceInfoSchema.parse(formData.practiceInfo);
      }
      if (activeTab === 'user-creation' || activeTab === 'extra-info') {
        userCreationSchema.parse(formData.userCreation);
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleNext = async (): Promise<void> => {
    if (isLastTab) {
      try {
        practiceInfoSchema.parse(formData.practiceInfo);
        userCreationSchema.parse(formData.userCreation);
        setShowVerificationModal(true);
      } catch (e) {
        if (e instanceof z.ZodError) {
          setErrors(toFieldErrors(e));
          const flattened = e.flatten();
          const errorFields = Object.keys(flattened.fieldErrors ?? {});
          const practiceInfoFields = [
            'practiceName',
            'bhfNumber',
            'hpcsaNumber',
            'practiceType',
            'vatNumber',
          ];
          const userCreationFields = [
            'firstName',
            'lastName',
            'username',
            'password',
            'confirmPassword',
          ];
          if (errorFields.some(f => practiceInfoFields.includes(f)))
            setActiveTab('practice-info');
          else if (errorFields.some(f => userCreationFields.includes(f)))
            setActiveTab('user-creation');
        }
      }
    } else {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      if (currentIndex < tabs.length - 1) {
        try {
          if (activeTab === 'practice-info')
            practiceInfoSchema.parse(formData.practiceInfo);
          else if (activeTab === 'user-creation')
            userCreationSchema.parse(formData.userCreation);
          setActiveTab(tabs[currentIndex + 1].id);
        } catch (e) {
          if (e instanceof z.ZodError) setErrors(toFieldErrors(e));
        }
      }
    }
  };

  const handlePrevious = (): void => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1].id);
  };

  const handleCancel = (): void => {
    router.push('/login/signin');
  };

  const handleVerificationSubmit = async (): Promise<void> => {
    try {
      practiceInfoSchema.parse(formData.practiceInfo);
      userCreationSchema.parse(formData.userCreation);
      await registerOrganization({
        practiceInfo: formData.practiceInfo,
        contactDetails: formData.contactDetails,
        userCreation: formData.userCreation,
      });
      setShowVerificationModal(false);
      router.push('/success');
    } catch (e) {
      if (e instanceof z.ZodError) setErrors(toFieldErrors(e));
      else console.error('Registration error:', e);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={
                tab.id === 'practice-info' &&
                !isFormValid &&
                activeTab === 'extra-info'
                  ? 'border-red-500 border-2'
                  : ''
              }
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="practice-info">
          <PracticeInfoForm
            value={formData.practiceInfo}
            onChange={value =>
              setFormData(prev => ({ ...prev, practiceInfo: value }))
            }
            errors={errors}
            practiceTypes={practiceTypes}
          />
        </TabsContent>
        <TabsContent value="contact-details">
          <ContactDetailsForm
            value={formData.contactDetails}
            onChange={value =>
              setFormData(prev => ({ ...prev, contactDetails: value }))
            }
          />
        </TabsContent>
        <TabsContent value="user-creation">
          <UserCreationForm
            value={formData.userCreation}
            onChange={value =>
              setFormData(prev => ({ ...prev, userCreation: value }))
            }
            errors={errors}
          />
        </TabsContent>
        <TabsContent value="extra-info">
          <ExtraInfoForm
            value={formData.extraInfo}
            onChange={value =>
              setFormData(prev => ({ ...prev, extraInfo: value }))
            }
          />
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
        <Button onClick={handleNext} disabled={isLastTab && !isFormValid()}>
          {isLastTab ? 'Finish' : 'Next'}
        </Button>
      </div>

      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onSubmit={handleVerificationSubmit}
      />
    </div>
  );
}
