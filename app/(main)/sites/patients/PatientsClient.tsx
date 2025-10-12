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
import { createPatient } from '@/app/actions/patients';
import { toast } from 'sonner';

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
    // Validate required fields
    if (!newPatient.name || !newPatient.dateOfBirth) {
      toast.error('Name and date of birth are required');
      return;
    }

    if (!newPatient.isUnder18 && !newPatient.id) {
      toast.error('ID is required for patients 18 years or older');
      return;
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
                  onChange={e =>
                    setNewPatient(prev => ({
                      ...prev,
                      dateOfBirth: e.target.value,
                    }))
                  }
                />
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
                    onChange={e =>
                      setNewPatient(prev => ({ ...prev, id: e.target.value }))
                    }
                    placeholder="Enter ID number"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="cellPhone">Cell Phone</Label>
                <Input
                  id="cellPhone"
                  value={newPatient.cellPhone}
                  onChange={e =>
                    setNewPatient(prev => ({
                      ...prev,
                      cellPhone: e.target.value,
                    }))
                  }
                  placeholder="Enter cell phone"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newPatient.email}
                  onChange={e =>
                    setNewPatient(prev => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter email"
                />
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
