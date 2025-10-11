'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';

interface UserCreationFormProps {
  value: {
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
  onChange: (_value: UserCreationFormProps['value']) => void;
  errors?: { [key: string]: string[] };
}

export function UserCreationForm({
  value,
  onChange,
  errors,
}: UserCreationFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange =
    (field: keyof typeof value) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...value,
        [field]: e.target.value,
      });
    };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({
          ...value,
          signature: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const hasMinLength = (pass: string) => pass.length >= 8;
  const hasUpperCase = (pass: string) => /[A-Z]/.test(pass);
  const hasNumber = (pass: string) => /[0-9]/.test(pass);
  const hasSpecialChar = (pass: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pass);

  const passwordRequirements = [
    { text: 'At least 8 characters long', valid: hasMinLength(value.password) },
    {
      text: 'Contains at least one uppercase letter',
      valid: hasUpperCase(value.password),
    },
    { text: 'Contains at least one number', valid: hasNumber(value.password) },
    {
      text: 'Contains at least one special character',
      valid: hasSpecialChar(value.password),
    },
  ];

  const hasErrors = errors && Object.keys(errors).length > 0;

  return (
    <div className="space-y-6 p-4">
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800">
            Please fill in all required fields marked with an asterisk (*)
          </p>
        </div>
      )}

      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Select
            value={value.title || ''}
            onValueChange={newValue => onChange({ ...value, title: newValue })}
          >
            <SelectTrigger id="title">
              <SelectValue placeholder="Select title" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mr">Mr</SelectItem>
              <SelectItem value="mrs">Mrs</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="initials">Initials</Label>
          <Input
            id="initials"
            placeholder="Enter initials"
            value={value.initials || ''}
            onChange={handleInputChange('initials')}
          />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid gap-2">
          <Label htmlFor="firstName">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            placeholder="Enter first name"
            value={value.firstName}
            onChange={handleInputChange('firstName')}
            className={errors?.firstName ? 'border-red-500' : ''}
          />
          {errors?.firstName && (
            <p className="text-sm text-red-600">{errors.firstName[0]}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lastName">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            placeholder="Enter last name"
            value={value.lastName}
            onChange={handleInputChange('lastName')}
            className={errors?.lastName ? 'border-red-500' : ''}
          />
          {errors?.lastName && (
            <p className="text-sm text-red-600">{errors.lastName[0]}</p>
          )}
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid gap-2">
          <Label htmlFor="hpcsa">HPCSA</Label>
          <Input
            id="hpcsa"
            placeholder="Enter HPCSA number"
            value={value.hpcsa || ''}
            onChange={handleInputChange('hpcsa')}
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

      {/* Row 4 */}
      <div className="grid gap-2">
        <Label htmlFor="username">
          Username <span className="text-red-500">*</span>
        </Label>
        <Input
          id="username"
          placeholder="Enter username"
          value={value.username}
          onChange={handleInputChange('username')}
          className={errors?.username ? 'border-red-500' : ''}
        />
        {errors?.username && (
          <p className="text-sm text-red-600">{errors.username[0]}</p>
        )}
      </div>

      {/* Row 5 */}
      <div className="grid gap-2">
        <Label htmlFor="password">
          Password <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter password"
            value={value.password}
            onChange={handleInputChange('password')}
            className={errors?.password ? 'border-red-500' : ''}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
        {errors?.password && (
          <p className="text-sm text-red-600">{errors.password[0]}</p>
        )}
        <ul className="text-sm text-muted-foreground ml-2 list-disc list-inside">
          {passwordRequirements.map((req, index) => (
            <li
              key={index}
              className={
                value.password
                  ? req.valid
                    ? 'text-green-600'
                    : 'text-red-600'
                  : ''
              }
            >
              {req.text}
            </li>
          ))}
        </ul>
      </div>

      {/* Row 6 */}
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">
          Re-enter Password <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm password"
            value={value.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            className={errors?.confirmPassword ? 'border-red-500' : ''}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
        {errors?.confirmPassword && (
          <p className="text-sm text-red-600">{errors.confirmPassword[0]}</p>
        )}
        {!errors?.confirmPassword && value.confirmPassword && (
          <p
            className={`text-sm ${value.password === value.confirmPassword ? 'text-green-600' : 'text-red-600'}`}
          >
            {value.password === value.confirmPassword
              ? 'Passwords match'
              : 'Passwords do not match'}
          </p>
        )}
      </div>

      {/* Row 7 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="grid gap-2">
          <Label>Signature</Label>
          <div className="border rounded-lg h-32 flex items-center justify-center bg-muted">
            {value.signature ? (
              <Image
                src={value.signature}
                alt="Signature"
                width={200}
                height={100}
                className="object-contain"
              />
            ) : (
              <p className="text-muted-foreground">No signature uploaded</p>
            )}
          </div>
        </div>
        <div className="grid gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleSignatureUpload}
            accept="image/*"
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            Upload Signature
          </Button>
        </div>
      </div>
    </div>
  );
}
