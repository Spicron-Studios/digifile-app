"use client";

import Error from 'next/error';
import { useEffect } from 'react';
import * as Sentry from "@sentry/browser";
import { initializeSentryClient } from '@/app/lib/sentry/client';

export default function GlobalError({
  error
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    initializeSentryClient();
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <Error statusCode={500} />
      </body>
    </html>
  );
}