'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import type { Account } from '@/app/types/calendar';

const FormSchema = z.object({
  id: z.string().optional(),
  userUid: z.string(),
  date: z.string(), // YYYY-MM-DD
  time: z.string(), // HH:mm
  endTime: z.string(), // HH:mm
  title: z.string().min(1),
  description: z.string().optional(),
});

export interface AppointmentModalProps {
  open: boolean;
  accounts: Account[];
  defaultDate: Date;
  initialValues?: Partial<z.infer<typeof FormSchema>>;
  onOpenChange: (_open: boolean) => void;
  onSave: (_values: z.infer<typeof FormSchema>) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}

export default function AppointmentModal(
  props: AppointmentModalProps
): React.JSX.Element {
  const {
    open,
    accounts,
    defaultDate,
    initialValues,
    onOpenChange,
    onSave,
    onDelete,
  } = props;
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      userUid: accounts[0]?.uid ?? '',
      date: defaultDate.toISOString().slice(0, 10),
      time: '09:00',
      endTime: '10:00',
      title: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (initialValues) {
      form.reset({
        userUid: initialValues.userUid ?? accounts[0]?.uid ?? '',
        date: initialValues.date ?? defaultDate.toISOString().slice(0, 10),
        time: initialValues.time ?? '09:00',
        endTime: initialValues.endTime ?? '10:00',
        title: initialValues.title ?? '',
        description: initialValues.description ?? '',
        id: initialValues.id,
      });
    }
  }, [open, initialValues, accounts, defaultDate, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {form.getValues('id') ? 'Edit Appointment' : 'Book Appointment'}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={form.handleSubmit(async values => {
            await onSave(values);
            onOpenChange(false);
          })}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Date</label>
              <Input type="date" {...form.register('date')} />
            </div>
            <div>
              <label className="text-xs font-medium">Doctor</label>
              <Select
                value={form.watch('userUid')}
                onValueChange={v => form.setValue('userUid', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.uid} value={a.uid}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Start</label>
              <Input type="time" step="1800" {...form.register('time')} />
            </div>
            <div>
              <label className="text-xs font-medium">End</label>
              <Input type="time" step="1800" {...form.register('endTime')} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Title</label>
            <Input {...form.register('title')} />
          </div>
          <div>
            <label className="text-xs font-medium">Description</label>
            <Textarea rows={3} {...form.register('description')} />
          </div>
          <div className="flex justify-between pt-2">
            {form.getValues('id') ? (
              <Button
                type="button"
                variant="destructive"
                onClick={async () => {
                  await onDelete?.();
                  onOpenChange(false);
                }}
              >
                Delete
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
