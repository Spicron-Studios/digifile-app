import { X } from 'lucide-react'
import { Account } from "@/app/types/calendar"
import { Button } from "@/app/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog"

interface AccountSelectorProps {
  accounts: Account[]
  selectedAccounts: string[]
  onToggleAccount: (accountId: string) => void
  onAddAccount: (account: Account) => void
}

export function AccountSelector({
  accounts,
  selectedAccounts,
  onToggleAccount,
  onAddAccount
}: AccountSelectorProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Add Account</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Accounts</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {accounts.map((account) => (
            <div key={account.AccountID} className="flex items-center gap-4">
              <input
                type="checkbox"
                id={account.AccountID}
                checked={selectedAccounts.includes(account.AccountID)}
                onChange={() => onToggleAccount(account.AccountID)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor={account.AccountID} className="text-sm font-medium">
                {account.Name}
              </label>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

