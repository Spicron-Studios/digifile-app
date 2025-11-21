"use client";

import type React from "react";

export function Label({
	children,
	htmlFor,
	...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
	// This is a wrapper component - htmlFor should be provided by the consumer
	return (
		<label
			{...props}
			htmlFor={htmlFor}
			className={`block mb-1 font-medium ${props.className}`}
		>
			{children}
		</label>
	);
}
