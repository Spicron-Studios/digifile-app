'use client'

import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"

export function ContactDetailsForm() {
  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Row 1 */}
        <div className="grid gap-2">
          <Label htmlFor="practiceTelephone">Practice Telephone Number</Label>
          <Input id="practiceTelephone" placeholder="Enter practice telephone" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="accountsTelephone">Accounts Telephone Number</Label>
          <Input id="accountsTelephone" placeholder="Enter accounts telephone" />
        </div>

        {/* Row 2 */}
        <div className="grid gap-2">
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input id="postalCode" placeholder="Enter postal code" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="fullAddress">Full Address</Label>
          <Input id="fullAddress" placeholder="Enter full address" />
        </div>

        {/* Row 3 */}
        <div className="grid gap-2">
          <Label htmlFor="practiceEmail">Practice Email</Label>
          <Input id="practiceEmail" type="email" placeholder="Enter practice email" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cellNumber">Cell Number</Label>
          <Input id="cellNumber" placeholder="Enter cell number" />
        </div>
      </div>

      {/* Row 4 - Full Width */}
      <div className="grid gap-2">
        <Label htmlFor="fax">Fax</Label>
        <Input id="fax" placeholder="Enter fax number" />
      </div>
    </div>
  )
}

