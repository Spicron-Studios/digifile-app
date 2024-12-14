import { LogLevel, LoggerConfig, LogEntry } from './types';

export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;

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
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public async init(): Promise<void> {
    // No initialization needed for client-side logging
    return Promise.resolve();
  }

  private formatLogEntry(level: LogLevel, fileName: string, message: string): string {
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
    return `[${timestamp}] (${level}) - ${fileName} - ${message}`;
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    const logMessage = this.formatLogEntry(entry.level, entry.fileName, entry.message);
    
    if (typeof window === 'undefined') {
      // Server-side logging
      const { writeServerLog } = require('./server-logger');
      await writeServerLog(logMessage);
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