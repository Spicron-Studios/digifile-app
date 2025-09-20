'use client';

import React from 'react';
import type { Account } from '@/app/types/calendar';

export interface AccountSelectorProps {
  accounts: Account[];
  selectedIds: string[];
  onChange: (_selected: string[]) => void;
}

export default function AccountSelector({
  accounts,
  selectedIds,
  onChange,
}: AccountSelectorProps): React.JSX.Element {
  function toggle(id: string): void {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {accounts.map(acc => {
        const checked = selectedIds.includes(acc.uid);
        return (
          <label
            key={acc.uid}
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={checked}
              onChange={() => toggle(acc.uid)}
            />
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: acc.color }}
            />
            <span>{acc.name}</span>
          </label>
        );
      })}
    </div>
  );
}
