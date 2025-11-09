'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { PaginatedPatients, CreatePatientData } from '@/app/types/patient';
import {
  createPatient,
  generatePublicIntakeLink,
  generateTabletIntakeLink,
} from '@/app/actions/patients';
import { toast } from 'sonner';
import {
  sanitizeDigits,
  parseSouthAfricanId,
  normalizePhoneInput,
  validatePhoneNumber,
  validateEmail,
  validateDateOfBirth,
} from '@/app/utils/helper-functions/sa-id';

interface PatientsClientProps {
  initialData: PaginatedPatients;
}

export default function PatientsClient({
  initialData,
}: PatientsClientProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    searchParams.get('search') || ''
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [intakeLink, setIntakeLink] = useState<string>('');
  const [tabletLink, setTabletLink] = useState<string>('');
  const [isGeneratingLinks, setIsGeneratingLinks] = useState(false);

  // Create patient form state
  const [newPatient, setNewPatient] = useState<CreatePatientData>({
    name: '',
    surname: '',
    dateOfBirth: '',
    id: '',
    isUnder18: false,
    title: '',
    gender: '',
    cellPhone: '',
    email: '',
    address: '',
  });
  const [validationErrors, setValidationErrors] = useState<{
    id?: string;
    dateOfBirth?: string;
    cellPhone?: string;
    email?: string;
  }>({});

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput) {
        params.set('search', searchInput);
      } else {
        params.delete('search');
      }
      params.set('page', '1'); // Reset to page 1 on new search
      router.push(`/sites/patients?${params.toString()}`);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchInput, searchParams, router]);

  const handleFilterChange = useCallback(
    (key: string, value: string | boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      // Handle special "all" value or empty values by removing the param
      if (value && value !== 'all') {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
      params.set('page', '1'); // Reset to page 1 on filter change
      router.push(`/sites/patients?${params.toString()}`);
    },
    [searchParams, router]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(page));
      router.push(`/sites/patients?${params.toString()}`);
    },
    [searchParams, router]
  );

  const handleCreatePatient = async (): Promise<void> => {
    // Check for existing validation errors
    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please fix validation errors before submitting');
      return;
    }

    // Validate required fields
    if (!newPatient.name || !newPatient.dateOfBirth) {
      toast.error('Name and date of birth are required');
      return;
    }

    if (!newPatient.isUnder18 && !newPatient.id) {
      toast.error('ID is required for patients 18 years or older');
      return;
    }

    // Validate ID if provided
    if (!newPatient.isUnder18 && newPatient.id) {
      const cleaned = sanitizeDigits(newPatient.id, 13);
      if (cleaned.length !== 13) {
        toast.error('ID number must be exactly 13 digits');
        return;
      }
      const parsed = parseSouthAfricanId(cleaned);
      if (!parsed.valid) {
        toast.error(parsed.reason || 'Invalid South African ID number');
        return;
      }
    }

    // Validate date of birth
    const dobValidation = validateDateOfBirth(newPatient.dateOfBirth);
    if (!dobValidation.valid) {
      toast.error(dobValidation.error || 'Invalid date of birth');
      return;
    }

    // Validate phone if provided
    if (newPatient.cellPhone) {
      const phoneValidation = validatePhoneNumber(newPatient.cellPhone);
      if (!phoneValidation.valid) {
        toast.error(phoneValidation.error || 'Invalid phone number');
        return;
      }
    }

    // Validate email if provided
    if (newPatient.email) {
      const emailValidation = validateEmail(newPatient.email);
      if (!emailValidation.valid) {
        toast.error(emailValidation.error || 'Invalid email address');
        return;
      }
    }

    setIsCreating(true);

    try {
      const result = await createPatient(newPatient);

      if (result.success && result.patient) {
        toast.success('Patient created successfully');
        setIsCreateModalOpen(false);
        // Reset form
        setNewPatient({
          name: '',
          surname: '',
          dateOfBirth: '',
          id: '',
          isUnder18: false,
          title: '',
          gender: '',
          cellPhone: '',
          email: '',
          address: '',
        });
        // Navigate to the new patient page
        router.push(`/sites/patients/${result.patient.uid}`);
      } else {
        toast.error(result.error || 'Failed to create patient');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateExpiringLink = async (): Promise<void> => {
    setIsGeneratingLinks(true);
    setIntakeLink('');
    try {
      const res = await generatePublicIntakeLink(window.location.origin);
      if ('error' in res) {
        toast.error(res.error);
      } else {
        setIntakeLink(res.url);
        toast.success('Expiring intake link generated');
      }
    } catch (_error) {
      toast.error('Failed to generate link');
    } finally {
      setIsGeneratingLinks(false);
    }
  };

  const handleGenerateTabletLink = async (): Promise<void> => {
    setIsGeneratingLinks(true);
    setTabletLink('');
    try {
      const res = await generateTabletIntakeLink(window.location.origin);
      if ('error' in res) {
        toast.error(res.error);
      } else {
        setTabletLink(res.url);
        toast.success('Tablet intake link generated');
      }
    } catch (_error) {
      toast.error('Failed to generate link');
    } finally {
      setIsGeneratingLinks(false);
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Patients</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateExpiringLink}
            disabled={isGeneratingLinks}
          >
            {isGeneratingLinks ? 'Generating…' : 'Generate Intake Link'}
          </Button>
          <Button
            variant="outline"
            onClick={handleGenerateTabletLink}
            disabled={isGeneratingLinks}
          >
            {isGeneratingLinks ? 'Generating…' : 'Generate Tablet Link'}
          </Button>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>Create New Patient</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Patient</DialogTitle>
              <DialogDescription>
                Enter patient details. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Select
                    {...(newPatient.title ? { value: newPatient.title } : {})}
                    onValueChange={value =>
                      setNewPatient(prev => ({ ...prev, title: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr">Mr</SelectItem>
                      <SelectItem value="Mrs">Mrs</SelectItem>
                      <SelectItem value="Ms">Ms</SelectItem>
                      <SelectItem value="Dr">Dr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    {...(newPatient.gender ? { value: newPatient.gender } : {})}
                    onValueChange={value =>
                      setNewPatient(prev => ({ ...prev, gender: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newPatient.name}
                    onChange={e =>
                      setNewPatient(prev => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <Label htmlFor="surname">Surname</Label>
                  <Input
                    id="surname"
                    value={newPatient.surname}
                    onChange={e =>
                      setNewPatient(prev => ({
                        ...prev,
                        surname: e.target.value,
                      }))
                    }
                    placeholder="Enter surname"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={newPatient.dateOfBirth}
                  onChange={e => {
                    const value = e.target.value;
                    setNewPatient(prev => ({
                      ...prev,
                      dateOfBirth: value,
                    }));
                    const dobValidation = validateDateOfBirth(value);
                    setValidationErrors(prev => {
                      const next = { ...prev };
                      if (dobValidation.valid) {
                        delete next.dateOfBirth;
                      } else if (dobValidation.error) {
                        next.dateOfBirth = dobValidation.error;
                      }
                      return next;
                    });
                  }}
                  aria-invalid={Boolean(validationErrors.dateOfBirth)}
                />
                {validationErrors.dateOfBirth && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {validationErrors.dateOfBirth}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isUnder18"
                  checked={newPatient.isUnder18 || false}
                  onCheckedChange={checked =>
                    setNewPatient(prev => ({
                      ...prev,
                      isUnder18: checked === true,
                    }))
                  }
                />
                <Label htmlFor="isUnder18" className="cursor-pointer">
                  Patient is under 18 (ID not required)
                </Label>
              </div>

              {!newPatient.isUnder18 && (
                <div>
                  <Label htmlFor="id">ID Number *</Label>
                  <Input
                    id="id"
                    value={newPatient.id}
                    onChange={e => {
                      const value = e.target.value;
                      const cleaned = sanitizeDigits(value, 13);
                      setNewPatient(prev => ({ ...prev, id: cleaned }));

                      if (cleaned.length > 0 && cleaned.length !== 13) {
                        setValidationErrors(prev => ({
                          ...prev,
                          id: 'ID must be exactly 13 digits',
                        }));
                      } else if (cleaned.length === 13) {
                        const parsed = parseSouthAfricanId(cleaned);
                        if (!parsed.valid) {
                          setValidationErrors(prev => ({
                            ...prev,
                            id:
                              parsed.reason ||
                              'Invalid South African ID number',
                          }));
                        } else {
                          setValidationErrors(prev => {
                            const next = { ...prev };
                            delete next.id;
                            return next;
                          });
                        }
                      } else {
                        setValidationErrors(prev => {
                          const next = { ...prev };
                          delete next.id;
                          return next;
                        });
                      }
                    }}
                    placeholder="Enter ID number"
                    inputMode="numeric"
                    maxLength={13}
                    aria-invalid={Boolean(validationErrors.id)}
                  />
                  {validationErrors.id && (
                    <span className="text-red-500 text-xs mt-1 block">
                      {validationErrors.id}
                    </span>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="cellPhone">Cell Phone</Label>
                <Input
                  id="cellPhone"
                  value={newPatient.cellPhone}
                  onChange={e => {
                    const value = e.target.value;
                    const normalized = normalizePhoneInput(value);
                    const phoneValidation = validatePhoneNumber(normalized);
                    setValidationErrors(prev => {
                      const next = { ...prev };
                      if (phoneValidation.valid) {
                        delete next.cellPhone;
                      } else if (phoneValidation.error) {
                        next.cellPhone = phoneValidation.error;
                      }
                      return next;
                    });
                    setNewPatient(prev => ({
                      ...prev,
                      cellPhone: normalized,
                    }));
                  }}
                  placeholder="Enter cell phone"
                  type="tel"
                  inputMode="tel"
                  aria-invalid={Boolean(validationErrors.cellPhone)}
                />
                {validationErrors.cellPhone && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {validationErrors.cellPhone}
                  </span>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newPatient.email}
                  onChange={e => {
                    const value = e.target.value;
                    setNewPatient(prev => ({ ...prev, email: value }));
                    const emailValidation = validateEmail(value);
                    setValidationErrors(prev => {
                      const next = { ...prev };
                      if (emailValidation.valid) {
                        delete next.email;
                      } else if (emailValidation.error) {
                        next.email = emailValidation.error;
                      }
                      return next;
                    });
                  }}
                  placeholder="Enter email"
                  aria-invalid={Boolean(validationErrors.email)}
                />
                {validationErrors.email && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {validationErrors.email}
                  </span>
                )}
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newPatient.address}
                  onChange={e =>
                    setNewPatient(prev => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  placeholder="Enter address"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button onClick={handleCreatePatient} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Patient'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(intakeLink || tabletLink) && (
        <Card className="p-4 mb-6">
          <div className="space-y-2">
            {intakeLink && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Intake Link (24h):</span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={intakeLink}
                    className="text-indigo-600 hover:text-indigo-900 break-all"
                    target="_blank"
                  >
                    {intakeLink}
                  </Link>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(intakeLink);
                      toast.success('Link copied to clipboard');
                    } catch (_error) {
                      toast.error('Failed to copy link');
                    }
                  }}
                >
                  Copy
                </Button>
              </div>
            )}
            {tabletLink && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Tablet Link:</span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={tabletLink}
                    className="text-indigo-600 hover:text-indigo-900 break-all"
                    target="_blank"
                  >
                    {tabletLink}
                  </Link>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(tabletLink);
                      toast.success('Link copied to clipboard');
                    } catch (_error) {
                      toast.error('Failed to copy link');
                    }
                  }}
                >
                  Copy
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="p-4 mb-6">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, ID, or date of birth"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="w-48">
              <Label>Order By</Label>
              <Select
                value={searchParams.get('orderBy') || 'lastEdit'}
                onValueChange={value => handleFilterChange('orderBy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastEdit">Recently Updated</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="dateOfBirth">Date of Birth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Label>Gender</Label>
              <Select
                value={searchParams.get('gender') || 'all'}
                onValueChange={value => handleFilterChange('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Label>Has ID</Label>
              <Select
                value={searchParams.get('hasId') || 'all'}
                onValueChange={value => handleFilterChange('hasId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Label>DOB From</Label>
              <Input
                type="date"
                value={searchParams.get('dobFrom') || ''}
                onChange={e => handleFilterChange('dobFrom', e.target.value)}
              />
            </div>

            <div className="w-48">
              <Label>DOB To</Label>
              <Input
                type="date"
                value={searchParams.get('dobTo') || ''}
                onChange={e => handleFilterChange('dobTo', e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Results */}
      {initialData.patients.length > 0 ? (
        <>
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Surname
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date of Birth
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {initialData.patients.map(patient => (
                  <tr key={patient.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {patient.id || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {patient.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {patient.surname || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatDate(patient.dateOfBirth)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {patient.gender || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {patient.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatDate(patient.lastEdit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/sites/patients/${patient.uid}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(initialData.page - 1) * initialData.limit + 1} to{' '}
              {Math.min(
                initialData.page * initialData.limit,
                initialData.total
              )}{' '}
              of {initialData.total} patients
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={initialData.page <= 1}
                onClick={() => handlePageChange(initialData.page - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: initialData.totalPages }, (_, i) => i + 1)
                .filter(
                  p =>
                    p === 1 ||
                    p === initialData.totalPages ||
                    Math.abs(p - initialData.page) <= 2
                )
                .map((p, idx, arr) => (
                  <div key={p} className="flex gap-2">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-3 py-2">...</span>
                    )}
                    <Button
                      variant={p === initialData.page ? 'default' : 'outline'}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </Button>
                  </div>
                ))}
              <Button
                variant="outline"
                disabled={initialData.page >= initialData.totalPages}
                onClick={() => handlePageChange(initialData.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No patients found</p>
        </div>
      )}
    </>
  );
}
