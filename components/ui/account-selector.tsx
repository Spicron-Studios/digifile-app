import { X } from 'lucide-react'
import { Account } from "@/types/calendar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getAccountColor } from "@/utils/calendar"

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
  onAddAccount,
}: AccountSelectorProps) {
  const availableAccounts = accounts.filter(
    (account) => !selectedAccounts.includes(account.AccountID)
  )

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border rounded-lg">
      {accounts
        .filter((account) => selectedAccounts.includes(account.AccountID))
        .map((account, index) => (
          <div
            key={account.AccountID}
            className={`flex items-center gap-2 px-3 py-1 text-sm ${getAccountColor(index)} text-white rounded-full`}
          >
            {account.Name}
            <button
              onClick={() => onToggleAccount(account.AccountID)}
              className="p-0.5 hover:bg-black/20 rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Add Account
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Account</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            {availableAccounts.map((account) => (
              <Button
                key={account.AccountID}
                variant="outline"
                onClick={() => {
                  onAddAccount(account)
                }}
              >
                {account.Name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

