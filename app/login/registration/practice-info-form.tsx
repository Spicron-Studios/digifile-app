'use client'

import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"

interface PracticeInfoFormProps {
  value: string
  onChange: (value: string) => void
}

export function PracticeInfoForm({ value, onChange }: PracticeInfoFormProps) {
  return (
    <div className="space-y-6 p-4">
      <div className="grid gap-2">
        <Label htmlFor="practiceName" className="after:content-['*'] after:ml-0.5 after:text-red-500">
          Practice Name
        </Label>
        <Input 
          id="practiceName" 
          placeholder="Enter practice name" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="bhfNumber">BHF Number</Label>
        <Input id="bhfNumber" placeholder="Enter BHF number" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="hpcsaNumber">HPCSA Number</Label>
        <Input id="hpcsaNumber" placeholder="Enter HPCSA number" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="practiceType">Practice Type</Label>
        <Select>
          <SelectTrigger id="practiceType">
            <SelectValue placeholder="Select practice type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dentist">Dentist</SelectItem>
            <SelectItem value="vodoo">Vodoo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="vatNumber">VAT Number</Label>
        <Input id="vatNumber" placeholder="Enter VAT number" />
      </div>
    </div>
  )
}

