"use client";

import type React from "react";

export function Label({
	children,
	...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
	return (
		<label {...props} className={`block mb-1 font-medium ${props.className}`}>
			{children}
		</label>
	);
}
