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
import chalk from 'chalk';

export class Logger {
  private static instance: Logger;
  private config!: LoggerConfig;
  private initialized: boolean = false;

  private constructor() {
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
        SUCCESS: true,
        CHECKPOINT: true,
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

  private async writeToFile(_message: string): Promise<void> {
    // File logging is disabled in this build to ensure compatibility with Edge runtime
    // and avoid Node.js module imports being crawled by the client/edge bundler.
    return;
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
    const colored = this.colorize(level, message);
    switch (level) {
      case 'ERROR':
        // eslint-disable-next-line no-console
        console.error(colored);
        break;
      case 'WARNING':
        // eslint-disable-next-line no-console
        console.warn(colored);
        break;
      case 'INFO':
      case 'SUCCESS':
      case 'CHECKPOINT':
        // eslint-disable-next-line no-console
        console.info(colored);
        break;
      case 'DEBUG':
        // eslint-disable-next-line no-console
        if (console.debug) {
          console.debug(colored);
        } else {
          // eslint-disable-next-line no-console
          console.log(colored);
        }
        break;
    }
  }

  private colorize(level: LogLevel, message: string): string {
    switch (level) {
      case 'ERROR':
        return chalk.red(message);
      case 'WARNING':
        return chalk.hex('#FFA500')(message); // Orange
      case 'INFO':
        return chalk.cyanBright(message); // Light blue
      case 'SUCCESS':
        return chalk.greenBright(message); // Light green
      case 'CHECKPOINT':
        return chalk.whiteBright(message); // White
      case 'DEBUG':
      default:
        return message;
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

  public async success(fileName: string, message: string): Promise<void> {
    await this.log('SUCCESS', fileName, message);
  }

  public async checkpoint(fileName: string, message: string): Promise<void> {
    await this.log('CHECKPOINT', fileName, message);
  }
}
