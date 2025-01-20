'use client'

import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"

interface ContactDetailsFormProps {
  value: {
    practiceTelephone?: string;
    accountsTelephone?: string;
    postalCode?: string;
    fullAddress?: string;
    practiceEmail?: string;
    cellNumber?: string;
    fax?: string;
  };
  onChange: (value: ContactDetailsFormProps['value']) => void;
}

export function ContactDetailsForm({ value, onChange }: ContactDetailsFormProps) {
  const handleInputChange = (field: keyof typeof value) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({
      ...value,
      [field]: e.target.value,
    });
  };

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid gap-2">
          <Label htmlFor="practiceTelephone">Practice Telephone Number</Label>
          <Input 
            id="practiceTelephone" 
            placeholder="Enter practice telephone"
            value={value.practiceTelephone || ''}
            onChange={handleInputChange('practiceTelephone')}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="accountsTelephone">Accounts Telephone Number</Label>
          <Input 
            id="accountsTelephone" 
            placeholder="Enter accounts telephone"
            value={value.accountsTelephone || ''}
            onChange={handleInputChange('accountsTelephone')}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input 
            id="postalCode" 
            placeholder="Enter postal code"
            value={value.postalCode || ''}
            onChange={handleInputChange('postalCode')}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="fullAddress">Full Address</Label>
          <Input 
            id="fullAddress" 
            placeholder="Enter full address"
            value={value.fullAddress || ''}
            onChange={handleInputChange('fullAddress')}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="practiceEmail">Practice Email</Label>
          <Input 
            id="practiceEmail" 
            type="email" 
            placeholder="Enter practice email"
            value={value.practiceEmail || ''}
            onChange={handleInputChange('practiceEmail')}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cellNumber">Cell Number</Label>
          <Input 
            id="cellNumber" 
            placeholder="Enter cell number"
            value={value.cellNumber || ''}
            onChange={handleInputChange('cellNumber')}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="fax">Fax</Label>
        <Input 
          id="fax" 
          placeholder="Enter fax number"
          value={value.fax || ''}
          onChange={handleInputChange('fax')}
        />
      </div>
    </div>
  )
}

