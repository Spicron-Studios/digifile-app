export { Logger } from './logger.service';
export * from './types';

export type ClientOrServerLogger = Pick<
  Logger,
  'init' | 'error' | 'warning' | 'info' | 'debug' | 'success' | 'checkpoint'
> & { side: 'client' | 'server' };

export function getLogger(): ClientOrServerLogger {
  if (typeof window === 'undefined') {
    const instance = Logger.getInstance();
    return Object.assign(instance, { side: 'server' as const });
  }
  // Client-side shim that forwards to server via API, and also logs to browser console
  const client = createClientLogger();
  return client;
}

function createClientLogger(): ClientOrServerLogger {
  async function send(
    level: string,
    fileName: string,
    message: string
  ): Promise<void> {
    try {
      await fetch('/api/logger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, fileName, message }),
        keepalive: true,
      });
    } catch {
      // swallow
    }
  }

  function browser(
    level: 'error' | 'warn' | 'info' | 'debug' | 'log',
    msg: string
  ): void {
    // eslint-disable-next-line no-console
    (console[level] ?? console.log)(msg);
  }

  return {
    side: 'client',
    async init(): Promise<void> {
      browser('info', '[Logger][CLIENT] initialized');
    },
    async error(fileName: string, message: string): Promise<void> {
      browser('error', `[CLIENT][ERROR] ${fileName} - ${message}`);
      await send('ERROR', fileName, message);
    },
    async warning(fileName: string, message: string): Promise<void> {
      browser('warn', `[CLIENT][WARNING] ${fileName} - ${message}`);
      await send('WARNING', fileName, message);
    },
    async info(fileName: string, message: string): Promise<void> {
      browser('info', `[CLIENT][INFO] ${fileName} - ${message}`);
      await send('INFO', fileName, message);
    },
    async debug(fileName: string, message: string): Promise<void> {
      browser('debug', `[CLIENT][DEBUG] ${fileName} - ${message}`);
      await send('DEBUG', fileName, message);
    },
    async success(fileName: string, message: string): Promise<void> {
      browser('info', `[CLIENT][SUCCESS] ${fileName} - ${message}`);
      await send('SUCCESS', fileName, message);
    },
    async checkpoint(fileName: string, message: string): Promise<void> {
      browser('info', `[CLIENT][CHECKPOINT] ${fileName} - ${message}`);
      await send('CHECKPOINT', fileName, message);
    },
  };
}
