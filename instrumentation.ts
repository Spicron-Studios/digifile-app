let initializeSentryServer: () => void = () => {};
const captureException: (error: Error) => void = () => {};

// Only initialize on the server side
if (process.env.NEXT_RUNTIME === 'nodejs') {
  // Dynamic import to avoid loading server modules on client
  import('./app/lib/sentry/server').then(
    ({ initializeSentryServer: serverInit }) => {
      initializeSentryServer = serverInit;
    }
  );
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    initializeSentryServer();
  }
}

export const onRequestError = (error: Error) => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    import('@sentry/node').then(Sentry => {
      Sentry.captureException(error);
    });
  }
};
