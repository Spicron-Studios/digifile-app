'use client';

import { useState, useTransition } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Account, CalendarEvent } from '@/app/types/calendar';
import {
  addAppointment,
  deleteAppointment,
  updateAppointment,
} from '@/app/actions/appointments';
import { DateTimePicker } from '@/app/components/ui/date-time-picker';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Calendar as CalendarIcon } from 'lucide-react';
import moment from 'moment';
import 'moment-timezone';

// Set moment to use South African Standard Time (UTC+2)
moment.tz.setDefault('Africa/Johannesburg');

const appointmentSchema = z
  .object({
    user_uid: z.string().min(1, 'Please select a user'),
    startdate: z.date(),
    enddate: z.date(),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
  })
  .refine(data => data.enddate > data.startdate, {
    message: 'End date must be after start date',
    path: ['enddate'],
  });

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentModalProps {
  accounts: Account[];
  onAppointmentAdded: () => void;
  selectedEvent?: CalendarEvent;
  onOpenChange?: (_open: boolean) => void;
  defaultOpen?: boolean;
  hasAdminAccess?: boolean;
}

export function AppointmentModal({
  accounts,
  onAppointmentAdded,
  selectedEvent,
  onOpenChange,
  defaultOpen = false,
  hasAdminAccess = false,
}: AppointmentModalProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      user_uid: selectedEvent?.accountId || '',
      startdate: selectedEvent ? new Date(selectedEvent.start) : new Date(),
      enddate: selectedEvent ? new Date(selectedEvent.end) : new Date(),
      title: selectedEvent?.title || '',
      description: selectedEvent?.description || '',
    },
  });

  const router = useRouter();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      form.reset();
      setError(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent?.id) {
      setError('Cannot delete: Invalid appointment ID');
      return;
    }

    startTransition(async () => {
      try {
        await deleteAppointment(selectedEvent.id);
        onAppointmentAdded();
        handleOpenChange(false);
        router.refresh();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to delete appointment'
        );
      }
    });
  };

  const onSubmit = async (data: AppointmentFormData) => {
    setError(null);
    startTransition(async () => {
      try {
        // Ensure dates are in South African Standard Time
        const startDate = moment
          .tz(data.startdate, 'Africa/Johannesburg')
          .toDate();
        const endDate = moment.tz(data.enddate, 'Africa/Johannesburg').toDate();

        const appointmentData = {
          ...data,
          startdate: startDate,
          enddate: endDate,
        };

        if (selectedEvent?.id) {
          // Update existing appointment
          await updateAppointment(selectedEvent.id, appointmentData);
        } else {
          // Add new appointment
          await addAppointment(appointmentData);
        }
        onAppointmentAdded();
        handleOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error('Error saving appointment:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to save appointment'
        );
      }
    });
  };

  const handleDateChange =
    (field: 'startdate' | 'enddate') => (date: Date | null) => {
      if (date) {
        // Ensure the date is in South African Standard Time
        const saDate = moment.tz(date, 'Africa/Johannesburg').toDate();
        form.setValue(field, saDate, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          {selectedEvent ? 'Edit Appointment' : 'Add Appointment'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            {selectedEvent ? 'Edit Appointment' : 'Add New Appointment'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user_uid" className="text-sm font-medium">
              User
            </Label>
            <select
              id="user_uid"
              {...form.register('user_uid')}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a user</option>
              {accounts.map(account => (
                <option
                  key={account.AccountID}
                  value={account.AccountID}
                  className="flex items-center gap-2"
                >
                  <div
                    className={`inline-block w-3 h-3 rounded-full mr-2 ${account.color}`}
                    aria-hidden="true"
                  />
                  {account.Name}
                </option>
              ))}
            </select>
            {form.formState.errors.user_uid && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.user_uid.message}
              </p>
            )}
          </div>

          {/* Start DateTime */}
          <div className="space-y-2">
            <Label htmlFor="startdate" className="text-sm font-medium">
              Start Date and Time
            </Label>
            <DateTimePicker
              id="startdate"
              value={form.watch('startdate')}
              onChange={handleDateChange('startdate')}
            />
            {form.formState.errors.startdate && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.startdate.message}
              </p>
            )}
          </div>

          {/* End DateTime */}
          <div className="space-y-2">
            <Label htmlFor="enddate" className="text-sm font-medium">
              End Date and Time
            </Label>
            <DateTimePicker
              id="enddate"
              value={form.watch('enddate')}
              onChange={handleDateChange('enddate')}
            />
            {form.formState.errors.enddate && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.enddate.message}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Appointment Title
            </Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="Enter appointment title"
            />
            {form.formState.errors.title && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Enter appointment description (optional)"
              rows={3}
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <div>
              {selectedEvent && hasAdminAccess && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Saving...
                  </>
                ) : selectedEvent ? (
                  'Update'
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
