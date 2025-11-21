"use client";

import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { useState } from "react";

interface VerificationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: () => void;
}

export function VerificationModal({
	isOpen,
	onClose,
	onSubmit,
}: VerificationModalProps) {
	const [emailCode, setEmailCode] = useState("");
	const [smsCode, setSmsCode] = useState("");
	const [emailSent, setEmailSent] = useState(false);
	const [smsSent, setSmsSent] = useState(false);
	const [emailVerified, setEmailVerified] = useState(false);
	const [smsVerified, setSmsVerified] = useState(false);

	const handleSendEmail = () => {
		// TODO: Implement email sending logic
		setEmailSent(true);
	};

	const handleSendSMS = () => {
		// TODO: Implement SMS sending logic
		setSmsSent(true);
	};

	const handleVerifyEmail = () => {
		// TODO: Implement email verification logic
		setEmailVerified(true);
	};

	const handleVerifySMS = () => {
		// TODO: Implement SMS verification logic
		setSmsVerified(true);
	};

	const isVerified = emailVerified || smsVerified;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Verify Your Identity</DialogTitle>
				</DialogHeader>
				<div className="space-y-6">
					<p className="text-sm text-muted-foreground">
						Please verify your identity using either email or SMS verification.
					</p>

					{/* Email Verification */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<span className="font-medium">Email Verification</span>
							<Button
								onClick={handleSendEmail}
								disabled={emailSent || smsVerified}
								size="sm"
							>
								{emailSent ? "Sent" : "Send Code"}
							</Button>
						</div>
						{emailSent && !emailVerified && (
							<div className="flex gap-4">
								<Input
									placeholder="Enter verification code"
									value={emailCode}
									onChange={(e) => setEmailCode(e.target.value)}
									disabled={emailVerified}
								/>
								<Button
									onClick={handleVerifyEmail}
									disabled={emailVerified || !emailCode}
									size="sm"
								>
									Verify
								</Button>
							</div>
						)}
						{emailVerified && (
							<p className="text-sm text-green-600">
								✓ Email verified successfully
							</p>
						)}
					</div>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-background px-2 text-muted-foreground">
								Or
							</span>
						</div>
					</div>

					{/* SMS Verification */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<span className="font-medium">SMS Verification</span>
							<Button
								onClick={handleSendSMS}
								disabled={smsSent || emailVerified}
								size="sm"
							>
								{smsSent ? "Sent" : "Send Code"}
							</Button>
						</div>
						{smsSent && !smsVerified && (
							<div className="flex gap-4">
								<Input
									placeholder="Enter verification code"
									value={smsCode}
									onChange={(e) => setSmsCode(e.target.value)}
									disabled={smsVerified}
								/>
								<Button
									onClick={handleVerifySMS}
									disabled={smsVerified || !smsCode}
									size="sm"
								>
									Verify
								</Button>
							</div>
						)}
						{smsVerified && (
							<p className="text-sm text-green-600">
								✓ SMS verified successfully
							</p>
						)}
					</div>

					{/* Submit Button */}
					<div className="flex justify-end">
						<Button onClick={onSubmit} disabled={!isVerified}>
							Complete Registration
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
