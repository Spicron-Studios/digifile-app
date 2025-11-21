import crypto from "node:crypto";

type IntakeTokenPayload = {
	orgId: string;
	exp?: number; // ms since epoch; omit for non-expiring tablet link
	type: "expiring" | "tablet";
};

function b64urlEncode(input: Buffer | string): string {
	return (typeof input === "string" ? Buffer.from(input) : input)
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");
}

function b64urlDecode(input: string): Buffer {
	const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
	return Buffer.from(normalized, "base64");
}

function sign(secret: string, payloadB64: string): string {
	return b64urlEncode(
		crypto.createHmac("sha256", secret).update(payloadB64).digest(),
	);
}

export function generateIntakeToken(
	payload: IntakeTokenPayload,
	secret: string | undefined,
): string {
	if (!secret) {
		throw new Error("Missing intake token secret");
	}
	const payloadJson = JSON.stringify(payload);
	const payloadB64 = b64urlEncode(payloadJson);
	const signature = sign(secret, payloadB64);
	return `${payloadB64}.${signature}`;
}

export function verifyIntakeToken(
	token: string,
	secret: string | undefined,
): { ok: true; data: IntakeTokenPayload } | { ok: false; error: string } {
	if (!secret) return { ok: false, error: "Server misconfiguration" };
	const parts = token.split(".");
	if (parts.length !== 2) return { ok: false, error: "Malformed token" };
	const [payloadB64, signature] = parts;
	if (!payloadB64 || !signature) return { ok: false, error: "Malformed token" };
	const expectedSig = sign(secret, payloadB64);

	// Constant-time comparison to prevent timing attacks
	const signatureBuffer = b64urlDecode(signature);
	const expectedSigBuffer = b64urlDecode(expectedSig);

	if (signatureBuffer.length !== expectedSigBuffer.length) {
		return { ok: false, error: "Invalid token signature" };
	}

	if (!crypto.timingSafeEqual(signatureBuffer, expectedSigBuffer)) {
		return { ok: false, error: "Invalid token signature" };
	}

	let parsed: IntakeTokenPayload;
	try {
		parsed = JSON.parse(
			b64urlDecode(payloadB64).toString("utf8"),
		) as IntakeTokenPayload;
	} catch {
		return { ok: false, error: "Invalid token payload" };
	}

	if (!parsed.orgId) return { ok: false, error: "Invalid token claims" };
	if (parsed.type === "expiring") {
		if (!parsed.exp || Date.now() >= parsed.exp)
			return { ok: false, error: "Token expired" };
	}
	return { ok: true, data: parsed };
}

export function generateExpiringLink(
	orgId: string,
	secret: string | undefined,
	baseUrl?: string,
): string {
	const token = generateIntakeToken(
		{ orgId, exp: Date.now() + 24 * 60 * 60 * 1000, type: "expiring" },
		secret,
	);
	const base = baseUrl || "";
	return base ? `${base}/intake/${token}` : `/intake/${token}`;
}

export function generateTabletLink(
	orgId: string,
	secret: string | undefined,
	baseUrl?: string,
): string {
	const token = generateIntakeToken({ orgId, type: "tablet" }, secret);
	const base = baseUrl || "";
	return base ? `${base}/intake/tablet/${token}` : `/intake/tablet/${token}`;
}
