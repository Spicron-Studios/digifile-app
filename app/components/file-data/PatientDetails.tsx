'use client';

import React, { useRef } from 'react';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

type DateParts = { year: string; month: string; day: string };

type Props = {
  patient: {
    id?: string;
    title?: string;
    name?: string;
    initials?: string;
    surname?: string;
    dob?: string;
    gender?: string;
    cell_phone?: string;
    additional_name?: string;
    additional_cell?: string;
    email?: string;
    address?: string;
  };
  dateOfBirth: DateParts;
  onDatePartChange: (
    _part: 'year' | 'month' | 'day',
    _value: string,
    _maxLen: number,
    _nextRef?: React.RefObject<HTMLInputElement | null>
  ) => void;
  onInputChange: (_field: string, _value: string) => void;
  onSelectChange: (_field: string, _value: string) => void;
  errors?: {
    id?: string;
    email?: string;
    cell_phone?: string;
    additional_cell?: string;
  };
};

export default function PatientDetails({
  patient,
  dateOfBirth,
  onDatePartChange,
  onInputChange,
  onSelectChange,
  errors,
}: Props): React.JSX.Element {
  const yearRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div className="space-y-2">
          <Label htmlFor="idNo">ID No</Label>
          <Input
            id="idNo"
            placeholder="Enter ID number"
            value={patient.id || ''}
            inputMode="numeric"
            maxLength={13}
            aria-invalid={Boolean(errors?.id)}
            onChange={e => onInputChange('id', e.target.value)}
          />
          {errors?.id && (
            <span className="text-red-500 text-xs">{errors.id}</span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Select
            value={patient.title || ''}
            onValueChange={value => onSelectChange('title', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select title" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mr">Mr</SelectItem>
              <SelectItem value="Mrs">Mrs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Enter name"
            value={patient.name || ''}
            onChange={e => onInputChange('name', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="initials">Initials</Label>
          <Input
            id="initials"
            placeholder="Auto-generated from name"
            value={patient.initials || ''}
            onChange={e => onInputChange('initials', e.target.value)}
            readOnly
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="surname">Surname</Label>
          <Input
            id="surname"
            placeholder="Enter surname"
            value={patient.surname || ''}
            onChange={e => onInputChange('surname', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dob-year">Date of Birth</Label>
          <div className="flex items-center">
            <div className="flex-1">
              <Input
                id="dob-year"
                ref={yearRef}
                placeholder="YYYY"
                maxLength={4}
                className="text-center"
                value={dateOfBirth.year}
                onChange={e =>
                  onDatePartChange('year', e.target.value, 4, monthRef)
                }
              />
            </div>
            <span className="px-2 text-gray-500">/</span>
            <div className="w-16">
              <Input
                id="dob-month"
                ref={monthRef}
                placeholder="MM"
                maxLength={2}
                className="text-center"
                value={dateOfBirth.month}
                onChange={e =>
                  onDatePartChange('month', e.target.value, 2, dayRef)
                }
              />
            </div>
            <span className="px-2 text-gray-500">/</span>
            <div className="w-16">
              <Input
                id="dob-day"
                ref={dayRef}
                placeholder="DD"
                maxLength={2}
                className="text-center"
                value={dateOfBirth.day}
                onChange={e => onDatePartChange('day', e.target.value, 2)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={patient.gender || ''}
            onValueChange={value => onSelectChange('gender', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cellphone">Cellphone</Label>
          <Input
            id="cellphone"
            placeholder="Enter cellphone number"
            value={patient.cell_phone || ''}
            type="tel"
            inputMode="tel"
            aria-invalid={Boolean(errors?.cell_phone)}
            onChange={e => onInputChange('cell_phone', e.target.value)}
          />
          {errors?.cell_phone && (
            <span className="text-red-500 text-xs">{errors.cell_phone}</span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalContact1">Additional Contact Name</Label>
          <Input
            id="additionalContact1"
            placeholder="Enter contact name"
            value={patient.additional_name || ''}
            onChange={e => onInputChange('additional_name', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalCell">Additional Contact Number</Label>
          <Input
            id="additionalCell"
            placeholder="Enter contact number"
            value={patient.additional_cell || ''}
            type="tel"
            inputMode="tel"
            aria-invalid={Boolean(errors?.additional_cell)}
            onChange={e => onInputChange('additional_cell', e.target.value)}
          />
          {errors?.additional_cell && (
            <span className="text-red-500 text-xs">
              {errors.additional_cell}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter email"
            value={patient.email || ''}
            aria-invalid={Boolean(errors?.email)}
            aria-describedby={errors?.email ? 'email-error' : undefined}
            onChange={e => onInputChange('email', e.target.value)}
          />
          {errors?.email && (
            <span
              id="email-error"
              role="alert"
              className="text-red-500 text-xs"
            >
              {errors.email}
            </span>
          )}
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="Enter address"
            value={patient.address || ''}
            onChange={e => onInputChange('address', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
