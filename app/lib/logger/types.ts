export type LogLevel =
	| "ERROR"
	| "WARNING"
	| "INFO"
	| "DEBUG"
	| "SUCCESS"
	| "CHECKPOINT";

export interface LoggerConfig {
	enabled: boolean; // master switch to enable/disable all logging
	consoleEnabled: boolean; // master enable/disable console output
	serverConsoleEnabled: boolean; // enable/disable server-side console output
	clientConsoleEnabled: boolean; // enable/disable client-side console output
	fileEnabled: boolean; // enable/disable file output
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
