import { type LogSeverity, crayon } from "./RuneSentinel.prismatic";

type LogFormat = "human" | "json";

type LogMethod = (...args: unknown[]) => string;

type ServerLogger = {
	log: LogMethod;
	info: LogMethod;
	warn: LogMethod;
	error: LogMethod;
	debug: LogMethod;
};

const nativeConsole = console;

const getLogFormat = (): LogFormat => {
	return process.env.LOG_FORMAT === "json" ? "json" : "human";
};

const serializeArgs = (args: unknown[]): string =>
	args
		.map((arg) => {
			if (typeof arg === "string") return arg;
			try {
				return JSON.stringify(arg);
			} catch {
				return String(arg);
			}
		})
		.join(" ");

let nodeCrypto: typeof import("crypto") | undefined;

const createTraceId = (): string => {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}

	if (typeof window === "undefined") {
		if (!nodeCrypto) {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			nodeCrypto = require("node:crypto") as typeof import("crypto");
		}
		return nodeCrypto.randomUUID();
	}

	const random = Math.random().toString(16).slice(2);
	const time = Date.now().toString(16);
	return `${time}-${random}`;
};

const createLog =
	(method: LogSeverity, colorFn: (text: string) => string): LogMethod =>
	(...args: unknown[]): string => {
		const uuid = createTraceId();
		const timestamp = new Date().toISOString();
		const format = getLogFormat();

		if (format === "json") {
			nativeConsole[method](
				JSON.stringify({
					uuid,
					timestamp,
					level: method,
					message: serializeArgs(args),
				}),
			);
		} else {
			const prefix = colorFn(`[${uuid}]`);
			nativeConsole[method](prefix, ...args);
		}

		return uuid;
	};

export const serverLogger: ServerLogger = {
	log: createLog("log", crayon.white),
	info: createLog("info", crayon.cyan),
	warn: createLog("warn", crayon.yellow),
	error: createLog("error", crayon.red),
	debug: createLog("debug", crayon.gray),
};
