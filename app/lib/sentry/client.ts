import * as Sentry from "@sentry/browser";

export const initializeSentryClient = () => {
  if (typeof window !== 'undefined') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
      integrations: [
        new Sentry.BrowserTracing(),
      ],
    });
  }
};