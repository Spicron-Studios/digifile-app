import type { LogSeverity } from "./RuneSentinel.prismatic";
import { browserLogger } from "./browser-logger";
import { serverLogger } from "./server-logger";

type LogMethod = (...args: unknown[]) => string;

export type Logger = {
	log: LogMethod;
	info: LogMethod;
	warn: LogMethod;
	error: LogMethod;
	debug: LogMethod;
};

const isServer = typeof window === "undefined";

export const logger: Logger = isServer ? serverLogger : browserLogger;

export type { LogSeverity };
