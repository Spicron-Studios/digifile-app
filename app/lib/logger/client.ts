import type { LogLevel } from './types';

export interface ClientLogger {
  init(): Promise<void>;
  error(_fileName: string, _message: string): Promise<void>;
  warning(_fileName: string, _message: string): Promise<void>;
  info(_fileName: string, _message: string): Promise<void>;
  debug(_fileName: string, _message: string): Promise<void>;
  success(_fileName: string, _message: string): Promise<void>;
  checkpoint(_fileName: string, _message: string): Promise<void>;
}

function browser(
  level: 'error' | 'warn' | 'info' | 'debug' | 'log',
  msg: string
): void {
  // eslint-disable-next-line no-console
  (console[level] ?? console.log)(msg);
}

async function send(
  level: LogLevel,
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

let instance: ClientLogger | undefined;

export function getClientLogger(): ClientLogger {
  if (instance) return instance;

  instance = {
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

  return instance;
}
