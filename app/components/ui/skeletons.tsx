import React from "react";
import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";

// Generic loading skeleton for various content types - optimized
export function ContentSkeleton({ className }: { className?: string }) {
	return (
		<div className={`space-y-3 ${className || ""}`}>
			<Skeleton className="h-4 w-3/4" />
			<Skeleton className="h-4 w-1/2" />
			<Skeleton className="h-4 w-2/3" />
			<Skeleton className="h-4 w-1/3" />
		</div>
	);
}

// Card skeleton for loading states
export function CardSkeleton({ className }: { className?: string }) {
	return (
		<Card className={className}>
			<CardHeader>
				<Skeleton className="h-6 w-1/3" />
			</CardHeader>
			<CardContent>
				<ContentSkeleton />
			</CardContent>
		</Card>
	);
}

// Form skeleton for loading forms - optimized
export function FormSkeleton({ fields = 3 }: { fields?: number }) {
	const fieldElements = Array.from({ length: fields }, (_, i) => (
		<div key={i} className="space-y-2">
			<Skeleton className="h-4 w-1/4" />
			<Skeleton className="h-10 w-full" />
		</div>
	));

	return (
		<div className="space-y-6">
			{fieldElements}
			<div className="flex justify-end space-x-2">
				<Skeleton className="h-10 w-20" />
				<Skeleton className="h-10 w-24" />
			</div>
		</div>
	);
}

// Table skeleton for data tables
export function TableSkeleton({
	rows = 5,
	columns = 4,
}: {
	rows?: number;
	columns?: number;
}) {
	return (
		<div className="space-y-3">
			{/* Table header */}
			<div className="flex space-x-4">
				{Array.from({ length: columns }).map((_, i) => (
					<Skeleton key={i} className="h-4 flex-1" />
				))}
			</div>
			{/* Table rows */}
			{Array.from({ length: rows }).map((_, rowIndex) => (
				<div key={rowIndex} className="flex space-x-4">
					{Array.from({ length: columns }).map((_, colIndex) => (
						<Skeleton key={colIndex} className="h-4 flex-1" />
					))}
				</div>
			))}
		</div>
	);
}

// List skeleton for user lists and similar components
export function ListSkeleton({ items = 3 }: { items?: number }) {
	return (
		<div className="space-y-4">
			{Array.from({ length: items }).map((_, i) => (
				<Card key={i} className="p-4">
					<div className="flex justify-between items-center">
						<div className="space-y-2">
							<Skeleton className="h-5 w-32" />
							<Skeleton className="h-4 w-48" />
						</div>
						<Skeleton className="h-9 w-16" />
					</div>
				</Card>
			))}
		</div>
	);
}

// Calendar skeleton for the calendar page
export function CalendarSkeleton() {
	return (
		<div className="flex flex-col gap-3 h-full min-h-0">
			{/* Top controls section */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
				<CardSkeleton />
				<CardSkeleton />
			</div>

			{/* Calendar grid section */}
			<Card className="flex-1 min-h-0">
				<CardContent className="h-full min-h-0 p-3">
					<div className="space-y-3">
						{/* Calendar header */}
						<div className="flex justify-between items-center">
							<Skeleton className="h-6 w-24" />
							<div className="flex space-x-2">
								<Skeleton className="h-8 w-8" />
								<Skeleton className="h-8 w-8" />
							</div>
						</div>

						{/* Days of week */}
						<div className="grid grid-cols-7 gap-1">
							{Array.from({ length: 7 }).map((_, i) => (
								<Skeleton key={i} className="h-6 w-full" />
							))}
						</div>

						{/* Calendar days */}
						<div className="grid grid-cols-7 gap-1">
							{Array.from({ length: 35 }).map((_, i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// Settings page skeleton
export function SettingsSkeleton() {
	return (
		<div className="h-full">
			<div className="flex h-full">
				{/* Sidebar */}
				<div className="w-64 border-r bg-gray-50 p-2 space-y-1">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-10 w-full" />
					))}
				</div>

				{/* Content */}
				<div className="flex-1 p-6">
					<GeneralSettingsSkeleton />
				</div>
			</div>
		</div>
	);
}

// General Settings tab skeleton - matches the actual layout
export function GeneralSettingsSkeleton() {
	return (
		<div className="h-full bg-gray-50">
			<div className="h-full overflow-y-auto">
				<div className="space-y-4 p-4">
					{/* Organization Info Card */}
					<Card className="p-6">
						<div className="grid grid-cols-2 gap-6">
							{/* Left Column - Logo Section */}
							<div className="space-y-4">
								{/* Logo placeholder */}
								<div className="space-y-4">
									<Skeleton className="aspect-square w-full max-w-[200px] h-[200px] rounded-lg" />
									<Skeleton className="h-10 w-full max-w-[200px]" />
								</div>

								{/* Practice Type Select */}
								<div className="pt-4">
									<Skeleton className="h-10 w-full" />
								</div>
							</div>

							{/* Right Column - Form Fields */}
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Skeleton className="h-4 w-20 mb-2" />
										<Skeleton className="h-10 w-full" />
									</div>
									<div>
										<Skeleton className="h-4 w-20 mb-2" />
										<Skeleton className="h-10 w-full" />
									</div>
									<div>
										<Skeleton className="h-4 w-24 mb-2" />
										<Skeleton className="h-10 w-full" />
									</div>
									<div>
										<Skeleton className="h-4 w-16 mb-2" />
										<Skeleton className="h-10 w-full" />
									</div>
								</div>
							</div>
						</div>
					</Card>

					{/* Contact Details Card */}
					<Card className="p-6">
						<div className="grid grid-cols-2 gap-6">
							{/* Left Column */}
							<div className="space-y-4">
								<div>
									<Skeleton className="h-4 w-24 mb-2" />
									<Skeleton className="h-10 w-full" />
								</div>
								<div>
									<Skeleton className="h-4 w-16 mb-2" />
									<Skeleton className="h-10 w-full" />
								</div>
								<div>
									<Skeleton className="h-4 w-20 mb-2" />
									<Skeleton className="h-10 w-full" />
								</div>
								<div>
									<Skeleton className="h-4 w-8 mb-2" />
									<Skeleton className="h-10 w-full" />
								</div>
							</div>

							{/* Right Column */}
							<div className="space-y-4">
								<div>
									<Skeleton className="h-4 w-24 mb-2" />
									<Skeleton className="h-10 w-full" />
								</div>
								<div>
									<Skeleton className="h-4 w-16 mb-2" />
									<Skeleton className="h-10 w-full" />
								</div>
								<div>
									<Skeleton className="h-4 w-12 mb-2" />
									<Skeleton className="h-10 w-full" />
								</div>
							</div>
						</div>
					</Card>

					{/* Consent Documents Card */}
					<Card className="p-6">
						<div className="space-y-4">
							<Skeleton className="h-6 w-40" />
							{Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="flex items-center justify-between">
									<Skeleton className="h-4 w-20" />
									<div className="flex gap-2">
										<Skeleton className="h-9 w-16" />
										<Skeleton className="h-9 w-20" />
									</div>
								</div>
							))}
						</div>
					</Card>

					{/* Save Changes Button */}
					<div className="flex justify-end">
						<Skeleton className="h-10 w-32" />
					</div>
				</div>
			</div>
		</div>
	);
}

// User settings skeleton (for the user list)
export function UserSettingsSkeleton() {
	return (
		<div className="space-y-4 p-4">
			<div className="flex justify-between items-center">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-9 w-24" />
			</div>
			<ListSkeleton items={4} />
		</div>
	);
}

// File data page skeleton - optimized for performance
export function FileDataSkeleton() {
	return (
		<div className="h-full flex overflow-hidden">
			{/* Left Section */}
			<div className="w-1/2 p-4 overflow-hidden">
				<Card className="h-full flex flex-col overflow-hidden">
					{/* Tabs */}
					<div className="flex space-x-1 p-1 border-b">
						<Skeleton className="h-10 flex-1" />
						<Skeleton className="h-10 flex-1" />
						<Skeleton className="h-10 flex-1" />
					</div>

					{/* Tab content - simplified form skeleton */}
					<div className="flex-1 p-6 space-y-4">
						{/* File info section */}
						<div className="grid grid-cols-2 gap-4 mb-6">
							<div>
								<Skeleton className="h-4 w-24 mb-2" />
								<Skeleton className="h-10 w-full" />
							</div>
							<div>
								<Skeleton className="h-4 w-32 mb-2" />
								<Skeleton className="h-10 w-full" />
							</div>
						</div>

						{/* Patient details section */}
						<div className="grid grid-cols-2 gap-4">
							{Array.from({ length: 8 }).map((_, i) => (
								<div key={i}>
									<Skeleton className="h-4 w-20 mb-2" />
									<Skeleton className="h-10 w-full" />
								</div>
							))}
						</div>
					</div>
				</Card>
			</div>

			{/* Right Section */}
			<div className="w-1/2 p-4 overflow-hidden">
				<Card className="h-full flex flex-col overflow-hidden">
					{/* Tabs */}
					<div className="flex space-x-1 p-1 border-b">
						<Skeleton className="h-10 flex-1" />
						<Skeleton className="h-10 flex-1" />
						<Skeleton className="h-10 flex-1" />
						<Skeleton className="h-10 flex-1" />
					</div>

					{/* Tab content - simplified content */}
					<div className="flex-1 p-4">
						<div className="space-y-3">
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
							<Skeleton className="h-4 w-2/3" />
							<Skeleton className="h-4 w-1/3" />
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
}

// Authentication form skeleton
export function AuthSkeleton() {
	return (
		<div className="container mx-auto max-w-md mt-20 p-6 space-y-6">
			{/* Logo */}
			<Skeleton className="h-8 w-24 mx-auto" />

			{/* Form */}
			<div className="space-y-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-10 w-full" />
				))}
				<Skeleton className="h-10 w-full" />
			</div>

			{/* Links */}
			<div className="flex justify-between">
				<Skeleton className="h-4 w-16" />
				<Skeleton className="h-4 w-24" />
			</div>
		</div>
	);
}

// Loading spinner for buttons and small components
export function LoadingSpinner({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
	const sizeClasses = {
		sm: "h-4 w-4",
		md: "h-6 w-6",
		lg: "h-8 w-8",
	};

	return (
		<div
			className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]}`}
		/>
	);
}
