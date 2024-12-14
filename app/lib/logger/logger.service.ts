/**
 * Example usage:
 * const logger = Logger.getInstance();
 * await logger.init();
 * await logger.info('myFile.ts', 'This is an info message');
 */


import { promises as fs } from 'fs';
import path from 'path';
import { LogLevel, LoggerConfig, LogEntry } from './types';

export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private initialized: boolean = false;
  private readonly LOG_DIR: string;

  private constructor() {
    this.config = {
      logLevels: {
        ERROR: true,
        WARNING: true,
        INFO: true,
        DEBUG: true
      },
      maxFileSize: 104857600, // 100MB
      maxLogFiles: 10,
      logDirectory: 'logs'
    };
    this.LOG_DIR = path.join(process.cwd(), this.config.logDirectory);
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public async init(): Promise<void> {
    if (this.initialized) return;
    
    console.log('Initializing logger...');
    if (typeof window === 'undefined') {
      // Server-side initialization
      await this.writeToFile('Logger initialized');
      console.log('Logger initialized on server side');
    } else {
      console.log('Logger initialized on client side');
    }
    this.initialized = true;
  }

  private formatLogEntry(level: LogLevel, fileName: string, message: string): string {
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
    return `[${timestamp}] (${level}) - ${fileName} - ${message}`;
  }
 
  private async writeToFile(message: string): Promise<void> {
    try {
      // Ensure log directory exists
      await fs.mkdir(this.LOG_DIR, { recursive: true });

      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.LOG_DIR, `app-${date}.log`);

      // Append message to log file
      await fs.appendFile(logFile, message + '\n');
      console.log('Successfully wrote to log file:', logFile);
    } catch (error) {
      console.error('Failed to write to log file:', error);
      throw error;
    }
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    const logMessage = this.formatLogEntry(entry.level, entry.fileName, entry.message);
    
    if (typeof window === 'undefined') {
      // Server-side logging
      console.log('Attempting server-side log:', logMessage);
      await this.writeToFile(logMessage);
    } else {
      // Client-side logging
      console.log(logMessage);
    }
  }

  public async log(level: LogLevel, fileName: string, message: string): Promise<void> {
    if (!this.config.logLevels[level]) return;

    await this.writeLog({
      timestamp: new Date().toISOString(),
      level,
      fileName,
      message
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