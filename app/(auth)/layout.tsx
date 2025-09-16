export const metadata = {
  title: 'DigiFile – Auth',
  description: 'Authentication pages',
};

import type React from 'react';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {children}
    </div>
  );
}
