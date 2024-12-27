// app/lib/sentry/server.ts
import * as Sentry from "@sentry/nextjs";

export const initializeSentryServer = () => {
  if (typeof window === 'undefined') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
    });
  }
};