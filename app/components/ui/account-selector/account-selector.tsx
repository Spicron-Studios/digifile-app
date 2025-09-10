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
import { Plus } from 'lucide-react';

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccounts: string[];
  onToggleAccount: (_accountId: string) => void;
  _onAddAccount: (_account: Account) => void;
}

export function AccountSelector({
  accounts,
  selectedAccounts,
  onToggleAccount,
  _onAddAccount,
}: AccountSelectorProps) {
  return (
    <div className="flex items-center gap-3 w-full max-w-md">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="shrink-0 h-9 px-3 text-sm flex items-center gap-2"
            disabled={selectedAccounts.length >= 51}
          >
            <Plus className="h-4 w-4" />
            Add Account
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Accounts</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4 max-h-[400px] overflow-y-auto">
            {accounts.map(account => (
              <div
                key={account.AccountID}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  id={account.AccountID}
                  checked={selectedAccounts.includes(account.AccountID)}
                  onChange={() => onToggleAccount(account.AccountID)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={
                    !selectedAccounts.includes(account.AccountID) &&
                    selectedAccounts.length >= 51
                  }
                />
                <label
                  htmlFor={account.AccountID}
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <div
                    className={`w-3 h-3 rounded-full ${account.color}`}
                    aria-hidden="true"
                  />
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
