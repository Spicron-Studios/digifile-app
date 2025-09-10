import { X } from 'lucide-react';
import { Account } from '@/app/types/calendar';

interface AccountChipProps {
  account: Account;
  color: string;
  onRemove: () => void;
}

export function AccountChip({ account, color, onRemove }: AccountChipProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border 
                 border-gray-300 shadow-sm hover:bg-gray-50 transition-all duration-200
                 text-sm font-medium"
    >
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} aria-hidden="true" />
      <span className="truncate max-w-[140px]">{account.Name}</span>
      <button
        onClick={e => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
        aria-label={`Remove ${account.Name}`}
      >
        <X className="h-3.5 w-3.5 text-gray-500" />
      </button>
    </div>
  );
}
