"use client";

import type { Account } from "@/app/types/calendar";
import type React from "react";

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
			onChange(selectedIds.filter((x) => x !== id));
		} else {
			onChange([...selectedIds, id]);
		}
	}

	return (
		<div className="flex flex-wrap gap-2">
			{accounts.map((acc) => {
				const checked = selectedIds.includes(acc.uid);
				return (
					<button
						key={acc.uid}
						type="button"
						onClick={() => toggle(acc.uid)}
						className={
							`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors ` +
							(checked
								? "bg-indigo-50 text-indigo-700 border-indigo-200"
								: "bg-white text-slate-700 hover:bg-slate-50")
						}
						aria-pressed={checked}
					>
						<span
							className="w-2.5 h-2.5 rounded-full"
							style={{ backgroundColor: acc.color }}
						/>
						<span className="whitespace-nowrap">{acc.name}</span>
					</button>
				);
			})}
		</div>
	);
}
