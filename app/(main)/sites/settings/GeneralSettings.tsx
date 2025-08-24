'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Upload } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { ConsentModal } from '@/app/components/ui/consent-modal';
import { toast } from 'sonner';
import { getOrganization, updateOrganization } from '@/app/actions/settings';
import {
  uploadOrganizationLogo,
  uploadOrganizationAsset,
} from '@/app/actions/settings-uploads';
import {
  getPracticeTypes,
  type PracticeType,
} from '@/app/actions/practice-types';
import { createClient } from '@supabase/supabase-js';

type OrganizationInfo = {
  uid: string;
  practice_name: string | null;
  practice_type: string | null;
  bhf_number: string | null;
  hpcsa: string | null;
  vat_no: string | null;
  address: string | null;
  postal: string | null;
  practice_telephone: string | null;
  accounts_telephone: string | null;
  cell: string | null;
  fax: string | null;
  email: string | null;
};

// PracticeType imported from server action

// Add Supabase client initialization
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function GeneralSettings() {
  const [orgInfo, setOrgInfo] = useState<OrganizationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState(
    '/placeholder.svg?height=200&width=200'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [practiceTypes, setPracticeTypes] = useState<PracticeType[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Fetch organization info
  useEffect(() => {
    const fetchOrgInfo = async () => {
      try {
        setError(null);
        const data = await getOrganization();
        setOrgInfo(data);
      } catch (error) {
        console.error('Error fetching organization info:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchOrgInfo();
  }, []);

  useEffect(() => {
    const fetchPracticeTypes = async () => {
      try {
        const data = await getPracticeTypes();
        setPracticeTypes(data);
      } catch (error) {
        console.error('Error fetching practice types:', error);
      }
    };

    void fetchPracticeTypes();
  }, []);

  // Fetch logo on component mount
  useEffect(() => {
    const fetchLogo = async () => {
      if (!orgInfo?.uid) return;

      const { data } = supabase.storage
        .from('DigiFile_Public')
        .getPublicUrl(`${orgInfo.uid}/logo/${orgInfo.uid}-logo.jpg`);

      if (data?.publicUrl) {
        setLogoUrl(data.publicUrl);
      }
    };

    fetchLogo();
  }, [orgInfo?.uid]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!orgInfo?.uid) return;

    try {
      // Handle logo upload if new file was selected
      if (logoFile) {
        const { url } = await uploadOrganizationLogo(logoFile);
        setLogoUrl(url);
      }

      const updated = await updateOrganization({
        practice_name: orgInfo.practice_name,
        practice_type: orgInfo.practice_type,
        bhf_number: orgInfo.bhf_number,
        vat_no: orgInfo.vat_no,
        address: orgInfo.address,
        postal: orgInfo.postal,
        practice_telephone: orgInfo.practice_telephone,
        accounts_telephone: orgInfo.accounts_telephone,
        cell: orgInfo.cell,
        fax: orgInfo.fax,
        email: orgInfo.email,
      });

      setOrgInfo(updated);
      toast.success('Organization information updated successfully');
    } catch (error) {
      console.error('Error updating organization info:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'An error occurred while updating'
      );
    }
  };

  const handleInputChange = (field: keyof OrganizationInfo, value: string) => {
    if (!orgInfo) return;
    setOrgInfo(prev => ({
      ...prev!,
      [field]: value,
    }));
  };

  const handleFileUpload = async (
    file: File,
    type: 'logo' | 'consent',
    consentNumber?: number
  ) => {
    if (!orgInfo?.uid) return;

    try {
      const { url } = await uploadOrganizationAsset(type, file, consentNumber);
      if (type === 'logo') setLogoUrl(url);
      toast.success(
        `${type === 'logo' ? 'Logo' : 'Consent document'} uploaded successfully`
      );
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload file'
      );
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
      handleFileUpload(file, 'logo');
    }
  };

  const handleConsentFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    consentNumber: number
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'consent', consentNumber);
    }
  };

  const openModal = (consentNumber: number) => {
    setSelectedConsent(consentNumber);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading organization information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!orgInfo) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">No organization information found.</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {/* Organization Info Card */}
          <Card className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Logo section */}
                <div className="space-y-4">
                  <div className="aspect-square w-full max-w-[200px] overflow-hidden rounded-lg border">
                    <Image
                      src={logoUrl}
                      alt="Company logo"
                      width={200}
                      height={200}
                      className="h-full w-full object-cover"
                      unoptimized
                      onError={() => {
                        setLogoUrl('/placeholder.svg?height=200&width=200');
                      }}
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
                </div>

                <div className="pt-4">
                  <Select
                    value={orgInfo?.practice_type || ''}
                    onValueChange={value =>
                      handleInputChange('practice_type', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Practice Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {practiceTypes.map(type => (
                        <SelectItem key={type.uuid} value={type.uuid}>
                          {type.codes} - {type.name}
                        </SelectItem>
                      ))}
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
                  <Input
                    id="practice-name"
                    value={orgInfo?.practice_name || ''}
                    onChange={e =>
                      handleInputChange('practice_name', e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label
                    htmlFor="bhf-number"
                    className="block text-sm font-medium text-gray-700"
                  >
                    BHF Number
                  </label>
                  <Input
                    id="bhf-number"
                    value={orgInfo?.bhf_number || ''}
                    onChange={e =>
                      handleInputChange('bhf_number', e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label
                    htmlFor="hpcsa"
                    className="block text-sm font-medium text-gray-700"
                  >
                    HPCSA Number
                  </label>
                  <Input
                    id="hpcsa"
                    value={orgInfo?.hpcsa || ''}
                    onChange={e => handleInputChange('hpcsa', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="pt-4">
                  <label
                    htmlFor="vat-number"
                    className="block text-sm font-medium text-gray-700"
                  >
                    VAT No.
                  </label>
                  <Input
                    id="vat-number"
                    value={orgInfo?.vat_no || ''}
                    onChange={e => handleInputChange('vat_no', e.target.value)}
                    className="mt-1"
                  />
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
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Address Physical
                  </label>
                  <Input
                    id="address"
                    value={orgInfo?.address || ''}
                    onChange={e => handleInputChange('address', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label
                    htmlFor="practice_telephone "
                    className="block text-sm font-medium text-gray-700"
                  >
                    Practice
                  </label>
                  <Input
                    id="practice_telephone"
                    value={orgInfo?.practice_telephone || ''}
                    onChange={e =>
                      handleInputChange('practice_telephone', e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cell"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Cell Number
                  </label>
                  <Input
                    id="cell"
                    value={orgInfo?.cell || ''}
                    onChange={e => handleInputChange('cell', e.target.value)}
                    type="tel"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label
                    htmlFor="fax"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Fax
                  </label>
                  <Input
                    id="fax"
                    value={orgInfo?.fax || ''}
                    onChange={e => handleInputChange('fax', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="postal"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Postal Address
                  </label>
                  <Input
                    id="postal"
                    value={orgInfo?.postal || ''}
                    onChange={e => handleInputChange('postal', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label
                    htmlFor="accounts_telephone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Accounts
                  </label>
                  <Input
                    id="accounts_telephone"
                    value={orgInfo?.accounts_telephone || ''}
                    onChange={e =>
                      handleInputChange('accounts_telephone', e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    value={orgInfo?.email || ''}
                    onChange={e => handleInputChange('email', e.target.value)}
                    type="email"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Consent Documents Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Consent Documents</h3>
              {[1, 2, 3].map(consentNumber => (
                <div
                  key={consentNumber}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-gray-700">
                    Consent {consentNumber}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
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
                        onChange={e =>
                          handleConsentFileUpload(e, consentNumber)
                        }
                      />
                      <label htmlFor={`consent-${consentNumber}-upload`}>
                        <Button variant="outline" type="button" asChild>
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

          {/* Save Changes Button */}
          <div className="flex justify-end">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>

      {selectedConsent && (
        <ConsentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          consentNumber={selectedConsent}
          orgId={orgInfo.uid}
        />
      )}
    </div>
  );
}
