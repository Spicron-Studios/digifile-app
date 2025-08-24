export type LogLevel = 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG';

export interface LoggerConfig {
  logLevels: Record<LogLevel, boolean>;
  maxFileSize: number; // in bytes
  maxLogFiles: number;
  logDirectory: string;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  fileName: string;
  message: string;
}
