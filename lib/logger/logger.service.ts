import fs from 'fs';
import path from 'path';
import { LogLevel, LoggerConfig, LogEntry } from './types';

export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private currentLogFile: string;

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
      logDirectory: path.join(process.cwd(), 'logs')
    };
    
    this.ensureLogDirectory();
    this.currentLogFile = this.getCurrentLogFile();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.config.logDirectory)) {
      fs.mkdirSync(this.config.logDirectory, { recursive: true });
      // Create .htaccess file for security
      fs.writeFileSync(
        path.join(this.config.logDirectory, '.htaccess'),
        'Deny from all'
      );
    }
  }

  private getCurrentLogFile(): string {
    const date = new Date().toISOString().split('T')[0];
    const baseName = path.join(this.config.logDirectory, `app-${date}`);
    let counter = 1;
    let fileName = `${baseName}.log`;

    while (
      fs.existsSync(fileName) &&
      fs.statSync(fileName).size >= this.config.maxFileSize
    ) {
      fileName = `${baseName}-${counter}.log`;
      counter++;
    }

    return fileName;
  }

  private formatLogEntry(level: LogLevel, fileName: string, message: string): string {
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
    return `[${timestamp}] (${level}) - ${fileName} - ${message}\n`;
  }

  private writeLog(entry: LogEntry): void {
    const logMessage = this.formatLogEntry(entry.level, entry.fileName, entry.message);
    
    // Check if current log file exceeds max size
    if (
      fs.existsSync(this.currentLogFile) &&
      fs.statSync(this.currentLogFile).size >= this.config.maxFileSize
    ) {
      this.currentLogFile = this.getCurrentLogFile();
      this.manageLogFiles();
    }

    fs.appendFileSync(this.currentLogFile, logMessage);
  }

  private manageLogFiles(): void {
    const files = fs.readdirSync(this.config.logDirectory)
      .filter(file => file.endsWith('.log'))
      .map(file => path.join(this.config.logDirectory, file));

    if (files.length > this.config.maxLogFiles) {
      files.sort((a, b) => fs.statSync(a).mtime.getTime() - fs.statSync(b).mtime.getTime());
      
      while (files.length > this.config.maxLogFiles) {
        const oldestFile = files.shift();
        if (oldestFile && fs.existsSync(oldestFile)) {
          fs.unlinkSync(oldestFile);
        }
      }
    }
  }

  public log(level: LogLevel, fileName: string, message: string): void {
    if (!this.config.logLevels[level]) return;

    this.writeLog({
      timestamp: new Date().toISOString(),
      level,
      fileName,
      message
    });
  }

  public error(fileName: string, message: string): void {
    this.log('ERROR', fileName, message);
  }

  public warning(fileName: string, message: string): void {
    this.log('WARNING', fileName, message);
  }

  public info(fileName: string, message: string): void {
    this.log('INFO', fileName, message);
  }

  public debug(fileName: string, message: string): void {
    this.log('DEBUG', fileName, message);
  }
}
