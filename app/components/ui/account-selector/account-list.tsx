import { Account } from "@/app/types/calendar"
import { AccountChip } from "./account-chip"

interface AccountListProps {
  accounts: Account[]
  selectedAccounts: string[]
  onRemoveAccount: (accountId: string) => void
}

export function AccountList({ accounts, selectedAccounts, onRemoveAccount }: AccountListProps) {
  const selectedAccountObjects = accounts.filter(account => 
    selectedAccounts.includes(account.AccountID)
  )

  return (
    <div className="flex gap-2 items-center overflow-x-auto py-1 px-2 min-h-[40px]">
      {selectedAccountObjects.map(account => (
        <AccountChip
          key={account.AccountID}
          account={account}
          color={account.color}
          onRemove={() => onRemoveAccount(account.AccountID)}
        />
      ))}
    </div>
  )
}
