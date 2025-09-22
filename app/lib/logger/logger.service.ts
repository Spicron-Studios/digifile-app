/**
 * Example usage:
 * const logger = Logger.getInstance();
 * await logger.init();
 * await logger.info('myFile.ts', 'This is an info message');
 *
 * This logger supports console and file outputs with runtime toggles.
 * - Console logging can run on both client and server, with independent toggles.
 * - File logging only runs on the server (Node.js) and is toggleable.
 */

import { LogLevel, LoggerConfig, LogEntry } from './types';

export class Logger {
  private static instance: Logger;
  private config!: LoggerConfig;
  private initialized: boolean = false;

  private constructor() {
    // Server-only module - throw error if used on client
    if (typeof window !== 'undefined') {
      throw new Error('Logger service can only be used on the server side');
    }
    this.config = {
      enabled: (process.env.LOGGER_ENABLED ?? 'true') === 'true',
      consoleEnabled: (process.env.LOGGER_CONSOLE_ENABLED ?? 'true') === 'true',
      serverConsoleEnabled:
        (process.env.LOGGER_SERVER_CONSOLE_ENABLED ?? 'true') === 'true',
      clientConsoleEnabled:
        (process.env.LOGGER_CLIENT_CONSOLE_ENABLED ?? 'true') === 'true',
      // Temporarily force file logging off; can be re-enabled via updateConfig at runtime
      fileEnabled: false,
      logLevels: {
        ERROR: true,
        WARNING: true,
        INFO: true,
        DEBUG: true,
      },
      maxFileSize: 104857600, // 100MB (reserved for future rotation logic)
      maxLogFiles: 10, // (reserved for future rotation logic)
      logDirectory: process.env.LOGGER_DIRECTORY ?? 'logs',
    };
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public updateConfig(partial: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  public getConfig(): Readonly<LoggerConfig> {
    return this.config;
  }

  public async init(): Promise<void> {
    if (this.initialized) return;

    if (this.config.enabled && this.config.consoleEnabled) {
      const isServer = this.isServer();
      const sideAllowed = isServer
        ? this.config.serverConsoleEnabled
        : this.config.clientConsoleEnabled;
      if (sideAllowed) {
        // eslint-disable-next-line no-console
        console.info(`[Logger][${isServer ? 'SERVER' : 'CLIENT'}] initialized`);
      }
    }

    if (this.config.enabled && this.config.fileEnabled && this.isServer()) {
      await this.writeToFile('Logger initialized');
    }

    this.initialized = true;
  }

  private isServer(): boolean {
    return typeof window === 'undefined';
  }

  private getOriginTag(): 'SERVER' | 'CLIENT' {
    return this.isServer() ? 'SERVER' : 'CLIENT';
  }

  private formatLogEntry(
    level: LogLevel,
    fileName: string,
    message: string
  ): string {
    const timestamp = new Date()
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '');
    const origin = this.getOriginTag();
    return `[${timestamp}] [${origin}] (${level}) - ${fileName} - ${message}`;
  }

  private async writeToFile(message: string): Promise<void> {
    if (!this.isServer()) return;

    try {
      // Only run on server - check for Node.js globals
      if (
        typeof globalThis !== 'undefined' &&
        typeof globalThis.process !== 'undefined'
      ) {
        const [fs, path] = await Promise.all([
          import('fs').then(m => m.promises),
          import('path'),
        ]);

        const logDir = path.join(process.cwd(), this.config.logDirectory);
        await fs.mkdir(logDir, { recursive: true });
        const date = new Date().toISOString().split('T')[0];
        const logFile = path.join(logDir, `app-${date}.log`);
        await fs.appendFile(logFile, message + '\n');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Failed to write to log file:', error);
      }
      // Swallow file write errors to avoid breaking the application
    }
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    if (!this.config.enabled) return;

    const logMessage = this.formatLogEntry(
      entry.level,
      entry.fileName,
      entry.message
    );

    if (this.config.consoleEnabled) {
      const isServer = this.isServer();
      const sideAllowed = isServer
        ? this.config.serverConsoleEnabled
        : this.config.clientConsoleEnabled;
      if (sideAllowed) {
        this.consoleOutput(entry.level, logMessage);
      }
    }

    if (this.config.fileEnabled && this.isServer()) {
      await this.writeToFile(logMessage);
    }
  }

  private consoleOutput(level: LogLevel, message: string): void {
    switch (level) {
      case 'ERROR':
        // eslint-disable-next-line no-console
        console.error(message);
        break;
      case 'WARNING':
        // eslint-disable-next-line no-console
        console.warn(message);
        break;
      case 'INFO':
        // eslint-disable-next-line no-console
        console.info(message);
        break;
      case 'DEBUG':
        // eslint-disable-next-line no-console
        if (console.debug) {
          console.debug(message);
        } else {
          console.log(message);
        }
        break;
    }
  }

  public async log(
    level: LogLevel,
    fileName: string,
    message: string
  ): Promise<void> {
    if (!this.config.logLevels[level]) return;

    await this.writeLog({
      timestamp: new Date().toISOString(),
      level,
      fileName,
      message,
    });
  }

  public async error(fileName: string, message: string): Promise<void> {
    await this.log('ERROR', fileName, message);
  }

  public async warning(fileName: string, message: string): Promise<void> {
    await this.log('WARNING', fileName, message);
  }

  public async info(fileName: string, message: string): Promise<void> {
    await this.log('INFO', fileName, message);
  }

  public async debug(fileName: string, message: string): Promise<void> {
    await this.log('DEBUG', fileName, message);
  }
}
