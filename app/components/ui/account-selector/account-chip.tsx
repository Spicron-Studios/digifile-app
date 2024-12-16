import { X } from 'lucide-react'
import { Account } from "@/app/types/calendar"

interface AccountChipProps {
  account: Account
  color: string
  onRemove: () => void
}

export function AccountChip({ account, color, onRemove }: AccountChipProps) {
  return (
    <div 
      className="flex items-center gap-2 px-2 py-1 rounded-full bg-white border 
                 border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
    >
      <div 
        className={`w-2 h-2 rounded-full ${color}`} 
        aria-hidden="true"
      />
      <span className="text-sm font-medium truncate max-w-[120px]">
        {account.Name}
      </span>
      <button
        onClick={onRemove}
        className="p-0.5 hover:bg-gray-200 rounded-full transition-colors"
        aria-label={`Remove ${account.Name}`}
      >
        <X className="h-3 w-3 text-gray-500" />
      </button>
    </div>
  )
}
