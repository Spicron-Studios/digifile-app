"use client"

import { useState, useTransition } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Account } from "@/app/types/calendar"
import { addAppointment } from "@/app/actions/appointments"
import { DateTimePicker } from "@/app/components/ui/date-time-picker"
import { useRouter } from "next/navigation"

interface AppointmentModalProps {
  accounts: Account[]
  onAppointmentAdded: () => void
}

const appointmentSchema = z.object({
  user_uid: z.string().nonempty("Please select a user"),
  startdate: z.date(),
  enddate: z.date(),
  title: z.string().nonempty("Title is required"),
  description: z.string().optional(),
}).refine(data => data.enddate > data.startdate, {
  message: "End date must be after start date",
  path: ["enddate"],
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

export function AppointmentModal({ accounts, onAppointmentAdded }: AppointmentModalProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      user_uid: '',
      startdate: new Date(),
      enddate: new Date(),
      title: '',
      description: '',
    }
  })

  const router = useRouter()

  const onSubmit = async (data: AppointmentFormData) => {
    setError(null)
    startTransition(async () => {
      try {
        if (!data.user_uid || !data.startdate || !data.enddate || !data.title) {
          throw new Error("Please fill in all required fields")
        }

        if (data.enddate <= data.startdate) {
          throw new Error("End date must be after start date")
        }

        await addAppointment(data)
        onAppointmentAdded()
        form.reset()
        setOpen(false)
        router.refresh()
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to add appointment")
        console.error("Failed to add appointment:", error)
      }
    })
  }

  const handleDateChange = (field: 'startdate' | 'enddate') => (date: Date | null) => {
    if (date) {
      form.setValue(field, date, {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Appointment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
              {error}
            </div>
          )}
          
          {/* User Selection */}
          <div>
            <Label htmlFor="user_uid">User</Label>
            <select id="user_uid" {...form.register("user_uid")} className="w-full p-2 border rounded">
              <option value="">Select a user</option>
              {accounts.map(account => (
                <option key={account.AccountID} value={account.AccountID}>
                  {account.Name}
                </option>
              ))}
            </select>
            {form.formState.errors.user_uid && <p className="text-red-500 text-sm">{form.formState.errors.user_uid.message}</p>}
          </div>

          {/* Start DateTime */}
          <div>
            <Label htmlFor="startdate">Start Date and Time</Label>
            <DateTimePicker
              id="startdate"
              value={form.watch('startdate')}
              onChange={handleDateChange('startdate')}
            />
            {form.formState.errors.startdate && <p className="text-red-500 text-sm">{form.formState.errors.startdate.message}</p>}
          </div>

          {/* End DateTime */}
          <div>
            <Label htmlFor="enddate">End Date and Time</Label>
            <DateTimePicker
              id="enddate"
              value={form.watch('enddate')}
              onChange={handleDateChange('enddate')}
            />
            {form.formState.errors.enddate && <p className="text-red-500 text-sm">{form.formState.errors.enddate.message}</p>}
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Appointment Title</Label>
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title && <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...form.register("description")} />
            {form.formState.errors.description && <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending}
            >
              {isPending ? "Adding..." : "Add Appointment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}