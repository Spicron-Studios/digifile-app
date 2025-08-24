import { Account } from '@/app/types/calendar';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { AccountList } from './account-list';

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccounts: string[];
  onToggleAccount: (_accountId: string) => void;
  onAddAccount: (_account: Account) => void;
}

export function AccountSelector({
  accounts,
  selectedAccounts,
  onToggleAccount,
}: AccountSelectorProps) {
  return (
    <div className="flex items-center gap-4 w-full border rounded-lg p-2 bg-white">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="shrink-0"
            disabled={selectedAccounts.length >= 51}
          >
            Add Account
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Accounts</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {accounts.map(account => (
              <div key={account.AccountID} className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id={account.AccountID}
                  checked={selectedAccounts.includes(account.AccountID)}
                  onChange={() => onToggleAccount(account.AccountID)}
                  className="h-4 w-4 rounded border-gray-300"
                  disabled={
                    !selectedAccounts.includes(account.AccountID) &&
                    selectedAccounts.length >= 51
                  }
                />
                <label
                  htmlFor={account.AccountID}
                  className="text-sm font-medium"
                >
                  {account.Name}
                </label>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <AccountList
        accounts={accounts}
        selectedAccounts={selectedAccounts}
        onRemoveAccount={onToggleAccount}
      />
    </div>
  );
}
