import type { LogSeverity } from "./RuneSentinel.prismatic";

type LogMethod = (...args: unknown[]) => string;

type BrowserLogger = {
	log: LogMethod;
	info: LogMethod;
	warn: LogMethod;
	error: LogMethod;
	debug: LogMethod;
};

const serializeArgs = (args: unknown[]): string =>
	args
		.map(arg => {
			if (typeof arg === "string") return arg;
			try {
				return JSON.stringify(arg);
			} catch {
				return String(arg);
			}
		})
		.join(" ");

const createTraceId = (): string => {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	const random = Math.random().toString(16).slice(2);
	const time = Date.now().toString(16);
	return `${time}-${random}`;
};

const createLog = (method: LogSeverity): LogMethod => {
	return (...args: unknown[]): string => {
		const uuid = createTraceId();
		const timestamp = new Date().toISOString();
		const prefix = `[${uuid}]`;

		const formatted = `${prefix} ${serializeArgs(args)}`;
		const consoleMethod = console[method] ?? console.log;
		consoleMethod.call(console, formatted, { timestamp, level: method });

		return uuid;
	};
};

export const browserLogger: BrowserLogger = {
	log: createLog("log"),
	info: createLog("info"),
	warn: createLog("warn"),
	error: createLog("error"),
	debug: createLog("debug"),
};


