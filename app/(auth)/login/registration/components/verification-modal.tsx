'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';

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
  const [emailCode, setEmailCode] = useState('');
  const [smsCode, setSmsCode] = useState('');
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Your Identity</DialogTitle>
          <Button
            variant="ghost"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="space-y-6">
          {/* Email Verification */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Use Email</span>
              <Button onClick={handleSendEmail} disabled={emailSent}>
                Send
              </Button>
            </div>
            <div className="flex gap-4">
              <Input
                placeholder="Enter verification code"
                value={emailCode}
                onChange={e => setEmailCode(e.target.value)}
                disabled={!emailSent || emailVerified}
              />
              <Button
                onClick={handleVerifyEmail}
                disabled={!emailSent || emailVerified || !emailCode}
              >
                Verify
              </Button>
            </div>
          </div>

          {/* SMS Verification */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Use SMS</span>
              <Button onClick={handleSendSMS} disabled={smsSent}>
                Send
              </Button>
            </div>
            <div className="flex gap-4">
              <Input
                placeholder="Enter verification code"
                value={smsCode}
                onChange={e => setSmsCode(e.target.value)}
                disabled={!smsSent || smsVerified}
              />
              <Button
                onClick={handleVerifySMS}
                disabled={!smsSent || smsVerified || !smsCode}
              >
                Verify
              </Button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={onSubmit}
              disabled={!emailVerified || !smsVerified}
            >
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
