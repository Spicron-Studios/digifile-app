'use client';

import React, { useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

type DateParts = { year: string; month: string; day: string };

export default function TabletExamplePage(): React.JSX.Element {
  const [patient, setPatient] = useState({
    id: '',
    name: '',
    surname: '',
    gender: '',
    cell_phone: '',
    address: '',
    dob: '',
  });
  const [dobParts, setDobParts] = useState<DateParts>({
    year: '',
    month: '',
    day: '',
  });

  const yearRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);

  function onInput(field: keyof typeof patient, value: string): void {
    setPatient(prev => ({ ...prev, [field]: value }));
  }

  function onGenderChange(value: string): void {
    setPatient(prev => ({ ...prev, gender: value }));
  }

  function onDobPartChange(
    part: 'year' | 'month' | 'day',
    value: string,
    maxLen: number,
    next?: React.RefObject<HTMLInputElement | null>
  ): void {
    if (!/^\d*$/.test(value)) return;
    if (part === 'month' && value.length === 2 && parseInt(value) > 12)
      value = '12';
    if (part === 'day' && value.length === 2 && parseInt(value) > 31)
      value = '31';

    setDobParts(prev => ({ ...prev, [part]: value }));

    const newDob =
      part === 'year'
        ? `${value}/${dobParts.month}/${dobParts.day}`
        : part === 'month'
          ? `${dobParts.year}/${value}/${dobParts.day}`
          : `${dobParts.year}/${dobParts.month}/${value}`;

    setPatient(prev => ({ ...prev, dob: newDob }));

    if (value.length === maxLen && next?.current) next.current.focus();
  }

  function onSubmit(e: React.FormEvent): void {
    e.preventDefault();
    // Demo submit: log values
    // In real flow, call an action to save the details
    // eslint-disable-next-line no-console
    console.log('Patient Demo Details:', patient);
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-blue-700">
            Patient Details (Demo)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="id">Patient ID</Label>
                <Input
                  id="id"
                  placeholder="Enter ID number"
                  value={patient.id}
                  onChange={e => onInput('id', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter name"
                  value={patient.name}
                  onChange={e => onInput('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="surname">Surname</Label>
                <Input
                  id="surname"
                  placeholder="Enter surname"
                  value={patient.surname}
                  onChange={e => onInput('surname', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <div className="flex items-center">
                  <div className="flex-1">
                    <Input
                      id="dob-year"
                      ref={yearRef}
                      placeholder="YYYY"
                      maxLength={4}
                      className="text-center"
                      value={dobParts.year}
                      onChange={e =>
                        onDobPartChange('year', e.target.value, 4, monthRef)
                      }
                    />
                  </div>
                  <span className="px-2 text-blue-400">/</span>
                  <div className="w-20">
                    <Input
                      id="dob-month"
                      ref={monthRef}
                      placeholder="MM"
                      maxLength={2}
                      className="text-center"
                      value={dobParts.month}
                      onChange={e =>
                        onDobPartChange('month', e.target.value, 2, dayRef)
                      }
                    />
                  </div>
                  <span className="px-2 text-blue-400">/</span>
                  <div className="w-20">
                    <Input
                      id="dob-day"
                      ref={dayRef}
                      placeholder="DD"
                      maxLength={2}
                      className="text-center"
                      value={dobParts.day}
                      onChange={e => onDobPartChange('day', e.target.value, 2)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={patient.gender} onValueChange={onGenderChange}>
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
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={patient.cell_phone}
                  onChange={e => onInput('cell_phone', e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Residential Address</Label>
                <Input
                  id="address"
                  placeholder="Enter address"
                  value={patient.address}
                  onChange={e => onInput('address', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Save Demo
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
