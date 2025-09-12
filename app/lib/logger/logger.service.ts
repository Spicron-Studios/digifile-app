/**
 * Example usage:
 * const logger = Logger.getInstance();
 * await logger.init();
 * await logger.info('myFile.ts', 'This is an info message');
 *
 * Note: This logger only works in server-side components.
 * It will silently ignore any logging attempts from client components.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { LogLevel, LoggerConfig, LogEntry } from './types';

export class Logger {
  private static instance: Logger;
  private config!: LoggerConfig;
  private initialized: boolean = false;
  private readonly LOG_DIR!: string;

  private constructor() {
    // Only initialize if we're on the server side
    if (typeof window === 'undefined') {
      this.config = {
        logLevels: {
          ERROR: true,
          WARNING: true,
          INFO: true,
          DEBUG: true,
        },
        maxFileSize: 104857600, // 100MB
        maxLogFiles: 10,
        logDirectory: 'logs',
      };
      this.LOG_DIR = path.join(process.cwd(), this.config.logDirectory);
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public async init(): Promise<void> {
    // Only initialize on server side
    if (typeof window !== 'undefined') return;

    if (this.initialized) return;

    await this.writeToFile('Logger initialized');
    this.initialized = true;
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
    return `[${timestamp}] (${level}) - ${fileName} - ${message}`;
  }

  private async writeToFile(message: string): Promise<void> {
    // Skip if we're on the client side
    if (typeof window !== 'undefined') return;

    try {
      await fs.mkdir(this.LOG_DIR, { recursive: true });
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.LOG_DIR, `app-${date}.log`);
      await fs.appendFile(logFile, message + '\n');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to write to log file:', error);
      }
      // Don't throw the error to avoid breaking the application
    }
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    // Skip if we're on the client side
    if (typeof window !== 'undefined') return;

    const logMessage = this.formatLogEntry(
      entry.level,
      entry.fileName,
      entry.message
    );
    await this.writeToFile(logMessage);
  }

  public async log(
    level: LogLevel,
    fileName: string,
    message: string
  ): Promise<void> {
    // Skip if we're on the client side
    if (typeof window !== 'undefined') return;

    if (!this.config?.logLevels[level]) return;

    await this.writeLog({
      timestamp: new Date().toISOString(),
      level,
      fileName,
      message,
    });
  }

  public async error(fileName: string, message: string): Promise<void> {
    if (typeof window !== 'undefined') return;
    await this.log('ERROR', fileName, message);
  }

  public async warning(fileName: string, message: string): Promise<void> {
    if (typeof window !== 'undefined') return;
    await this.log('WARNING', fileName, message);
  }

  public async info(fileName: string, message: string): Promise<void> {
    if (typeof window !== 'undefined') return;
    await this.log('INFO', fileName, message);
  }

  public async debug(fileName: string, message: string): Promise<void> {
    if (typeof window !== 'undefined') return;
    await this.log('DEBUG', fileName, message);
  }
}
