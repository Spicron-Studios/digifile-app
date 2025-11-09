'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
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
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';
import {
  sanitizeDigits,
  parseSouthAfricanId,
  normalizePhoneInput,
  validatePhoneNumber,
  validateEmail,
  validateDateOfBirth,
} from '@/app/utils/helper-functions/sa-id';

export default function IntakePage() {
  const { token } = useParams<{ token: string }>();

  const [form, setForm] = useState({
    name: '',
    surname: '',
    dateOfBirth: '',
    isUnder18: false,
    id: '',
    title: '',
    gender: '',
    cellPhone: '',
    email: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    id?: string;
    dateOfBirth?: string;
    cellPhone?: string;
    email?: string;
  }>({});

  useEffect(() => {
    async function checkToken() {
      setTokenValid(null);
      setError(null);
      try {
        const res = await fetch(`/api/public/intake/${token}`, {
          method: 'OPTIONS',
        });
        setTokenValid(res.ok);
      } catch {
        setTokenValid(false);
      }
    }
    if (token) checkToken();
  }, [token]);

  const updateField = (key: keyof typeof form) => (value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));

    // Real-time validation
    if (key === 'id' && typeof value === 'string') {
      const cleaned = sanitizeDigits(value, 13);
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
            id: parsed.reason || 'Invalid South African ID number',
          }));
        } else {
          setValidationErrors(prev => ({ ...prev, id: undefined }));
        }
      } else {
        setValidationErrors(prev => ({ ...prev, id: undefined }));
      }
    }

    if (key === 'dateOfBirth' && typeof value === 'string') {
      const dobValidation = validateDateOfBirth(value);
      setValidationErrors(prev => ({
        ...prev,
        dateOfBirth: dobValidation.valid ? undefined : dobValidation.error,
      }));
    }

    if (key === 'cellPhone' && typeof value === 'string') {
      const normalized = normalizePhoneInput(value);
      const phoneValidation = validatePhoneNumber(normalized);
      setValidationErrors(prev => ({
        ...prev,
        cellPhone: phoneValidation.valid ? undefined : phoneValidation.error,
      }));
      setForm(prev => ({ ...prev, cellPhone: normalized }));
      return;
    }

    if (key === 'email' && typeof value === 'string') {
      const emailValidation = validateEmail(value);
      setValidationErrors(prev => ({
        ...prev,
        email: emailValidation.valid ? undefined : emailValidation.error,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!form.name.trim() || !form.dateOfBirth.trim()) {
      setError('Please fill in required fields.');
      setSubmitting(false);
      return;
    }
    if (!form.isUnder18 && (!form.id || form.id.trim() === '')) {
      setError('ID number is required for adults.');
      setSubmitting(false);
      return;
    }

    // Validate ID if provided
    if (!form.isUnder18 && form.id) {
      const cleaned = sanitizeDigits(form.id, 13);
      if (cleaned.length !== 13) {
        setError('ID number must be exactly 13 digits.');
        setSubmitting(false);
        return;
      }
      const parsed = parseSouthAfricanId(cleaned);
      if (!parsed.valid) {
        setError(parsed.reason || 'Invalid South African ID number.');
        setSubmitting(false);
        return;
      }
    }

    // Validate date of birth
    const dobValidation = validateDateOfBirth(form.dateOfBirth);
    if (!dobValidation.valid) {
      setError(dobValidation.error || 'Invalid date of birth.');
      setSubmitting(false);
      return;
    }

    // Validate phone if provided
    if (form.cellPhone) {
      const phoneValidation = validatePhoneNumber(form.cellPhone);
      if (!phoneValidation.valid) {
        setError(phoneValidation.error || 'Invalid phone number.');
        setSubmitting(false);
        return;
      }
    }

    // Validate email if provided
    if (form.email) {
      const emailValidation = validateEmail(form.email);
      if (!emailValidation.valid) {
        setError(emailValidation.error || 'Invalid email address.');
        setSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/public/intake/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      let errorMessage: string | undefined;

      // Safely parse response body - read as text first to allow fallback
      try {
        const contentType = res.headers.get('content-type');
        const text = await res.text();

        if (contentType?.includes('application/json')) {
          try {
            const json = JSON.parse(text);
            if (!res.ok) {
              errorMessage = json.error || `Server error (${res.status})`;
            }
          } catch {
            // JSON parsing failed - use text response
            if (!res.ok) {
              errorMessage =
                text || res.statusText || `Server error (${res.status})`;
            }
          }
        } else {
          // Non-JSON response
          if (!res.ok) {
            errorMessage =
              text || res.statusText || `Server error (${res.status})`;
          }
        }
      } catch {
        // Failed to read response body
        if (!res.ok) {
          errorMessage = res.statusText || `Server error (${res.status})`;
        }
      }

      if (!res.ok) {
        setError(errorMessage || 'Submission failed');
        toast.error(errorMessage || 'Submission failed');
      } else {
        setSuccess('Thank you! Your information has been submitted.');
        toast.success('Submission successful');
        setForm({
          name: '',
          surname: '',
          dateOfBirth: '',
          isUnder18: false,
          id: '',
          title: '',
          gender: '',
          cellPhone: '',
          email: '',
          address: '',
        });
      }
    } catch {
      setError('Network error');
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>
        <h1>Link expired or invalid</h1>
        <p>
          Your link has expired. Please contact the practice for a new link.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Patient Intake</CardTitle>
        </CardHeader>
        <CardContent>
          {tokenValid === null && (
            <div className="text-sm text-gray-500">Validating link…</div>
          )}
          {tokenValid === false && (
            <div className="text-sm text-red-600">
              This link is invalid or expired.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={e => updateField('name')(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <Label htmlFor="surname">Surname</Label>
                <Input
                  id="surname"
                  value={form.surname}
                  onChange={e => updateField('surname')(e.target.value)}
                  placeholder="Doe"
                />
              </div>

              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={e => updateField('dateOfBirth')(e.target.value)}
                  required
                  aria-invalid={Boolean(validationErrors.dateOfBirth)}
                />
                {validationErrors.dateOfBirth && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {validationErrors.dateOfBirth}
                  </span>
                )}
              </div>
              <div>
                <Label>Under 18?</Label>
                <Select
                  value={form.isUnder18 ? 'yes' : 'no'}
                  onValueChange={val => updateField('isUnder18')(val === 'yes')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="id">
                  ID Number {form.isUnder18 ? '(optional)' : '(required)'}
                </Label>
                <Input
                  id="id"
                  value={form.id}
                  onChange={e => updateField('id')(e.target.value)}
                  placeholder="e.g. 9001015009087"
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

              <div>
                <Label>Title</Label>
                <Select
                  value={form.title || ''}
                  onValueChange={val => updateField('title')(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
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
                <Label>Gender</Label>
                <Select
                  value={form.gender || ''}
                  onValueChange={val => updateField('gender')(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cell">Cell Phone</Label>
                <Input
                  id="cell"
                  value={form.cellPhone}
                  onChange={e => updateField('cellPhone')(e.target.value)}
                  placeholder="e.g. 0821234567"
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
                  value={form.email}
                  onChange={e => updateField('email')(e.target.value)}
                  placeholder="you@example.com"
                  aria-invalid={Boolean(validationErrors.email)}
                />
                {validationErrors.email && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {validationErrors.email}
                  </span>
                )}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={e => updateField('address')(e.target.value)}
                  placeholder="Street, City"
                />
              </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
            {success && <div className="text-sm text-green-600">{success}</div>}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitting || tokenValid !== true}
                className="w-full"
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
