'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { GeneralSettings } from "./GeneralSettings"
import { UserSettings } from "./UserSettings"
import { DebitOrderSettings } from "./DebitOrderSettings"

export default function SettingsPage() {
  return (
    <div className="flex h-screen bg-white">
      <Tabs defaultValue="general" className="flex h-full w-full">
        <div className="w-64 border-r bg-gray-50">
          <TabsList className="flex h-full w-full flex-col items-stretch gap-1 bg-transparent p-2">
            <TabsTrigger
              value="general"
              className="justify-start data-[state=active]:bg-white"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="justify-start data-[state=active]:bg-white"
            >
              Users
            </TabsTrigger>
            <TabsTrigger
              value="debit-order"
              className="justify-start data-[state=active]:bg-white"
            >
              Debit Order
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="general" className="h-full mt-0 border-0 p-0">
            <GeneralSettings />
          </TabsContent>

          <TabsContent value="users" className="h-full mt-0 border-0 p-0">
            <UserSettings />
          </TabsContent>

          <TabsContent value="debit-order" className="h-full mt-0 border-0 p-0">
            <DebitOrderSettings />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

