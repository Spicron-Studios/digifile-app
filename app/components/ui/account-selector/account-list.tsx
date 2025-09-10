import { Account } from '@/app/types/calendar';
import { AccountChip } from './account-chip';

interface AccountListProps {
  accounts: Account[];
  selectedAccounts: string[];
  onRemoveAccount: (_accountId: string) => void;
}

export function AccountList({
  accounts,
  selectedAccounts,
  onRemoveAccount,
}: AccountListProps) {
  const selectedAccountObjects = accounts.filter(account =>
    selectedAccounts.includes(account.AccountID)
  );

  if (selectedAccountObjects.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic px-2">
        No accounts selected
      </div>
    );
  }

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
  );
}
