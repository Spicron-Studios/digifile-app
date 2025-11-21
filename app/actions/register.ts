"use server";

import db, { organizationInfo, users, roles } from "@/app/lib/drizzle";
import { and, eq, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

// Payload shapes sent from the registration client
const practiceInfoSchema = z.object({
	practiceName: z.string().min(1),
	bhfNumber: z.string().min(1),
	hpcsaNumber: z
		.string()
		.transform((val) => (val === "" ? null : val))
		.optional()
		.nullable(),
	practiceType: z
		.string()
		.transform((val) => (val === "" ? null : val))
		.optional()
		.nullable(),
	vatNumber: z
		.string()
		.transform((val) => (val === "" ? null : val))
		.optional()
		.nullable(),
});

const contactDetailsSchema = z.object({
	practiceTelephone: z
		.string()
		.transform((val) => (val === "" ? null : val))
		.optional()
		.nullable(),
	accountsTelephone: z
		.string()
		.transform((val) => (val === "" ? null : val))
		.optional()
		.nullable(),
	postalCode: z
		.string()
		.transform((val) => (val === "" ? null : val))
		.optional()
		.nullable(),
	fullAddress: z
		.string()
		.transform((val) => (val === "" ? null : val))
		.optional()
		.nullable(),
	practiceEmail: z
		.union([z.string().email(), z.literal(""), z.null(), z.undefined()])
		.transform((val) => (val === "" ? null : val)),
	cellNumber: z
		.string()
		.transform((val) => (val === "" ? null : val))
		.optional()
		.nullable(),
	fax: z
		.string()
		.transform((val) => (val === "" ? null : val))
		.optional()
		.nullable(),
});

const userCreationSchema = z
	.object({
		firstName: z.string().min(1),
		lastName: z.string().min(1),
		username: z.string().min(1),
		password: z.string().min(8),
		confirmPassword: z.string().min(8),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

export type RegisterPayload = {
	practiceInfo: z.infer<typeof practiceInfoSchema>;
	contactDetails: z.infer<typeof contactDetailsSchema>;
	userCreation: z.infer<typeof userCreationSchema>;
	// extraInfo is intentionally ignored at this stage
};

export async function registerOrganization(
	payload: RegisterPayload,
): Promise<{ success: true }> {
	const practiceInfo = practiceInfoSchema.parse(payload.practiceInfo);
	const contactDetails = contactDetailsSchema.parse(payload.contactDetails);
	const userCreation = userCreationSchema.parse(payload.userCreation);

	const organizationUid = uuidv4();
	const userUid = uuidv4();

	// Create organization
	await db.insert(organizationInfo).values({
		uid: organizationUid,
		practiceName: practiceInfo.practiceName,
		bhfNumber: practiceInfo.bhfNumber,
		hpcsa: practiceInfo.hpcsaNumber ?? null,
		practiceType: practiceInfo.practiceType ?? null,
		vatNo: practiceInfo.vatNumber ?? null,
		practiceTelephone: contactDetails.practiceTelephone ?? null,
		accountsTelephone: contactDetails.accountsTelephone ?? null,
		postal: contactDetails.postalCode ?? null,
		address: contactDetails.fullAddress ?? null,
		email: contactDetails.practiceEmail ?? null,
		cell: contactDetails.cellNumber ?? null,
		fax: contactDetails.fax ?? null,
		active: true,
		dateCreated: new Date().toISOString(),
		lastEdit: new Date().toISOString(),
		locked: false,
		consentToTreatment: null,
		consentToFinancialResponsibility: null,
		consentToReleaseOfInformation: null,
	});

	// Ensure SuperUser role exists
	const existingSuperUser = await db
		.select({ uid: roles.uid })
		.from(roles)
		.where(
			and(
				inArray(roles.roleName, ["SuperUser", "superuser", "SUPERUSER"]),
				eq(roles.active, true),
			),
		)
		.limit(1);

	let superUserRoleId = existingSuperUser[0]?.uid;

	if (!superUserRoleId) {
		superUserRoleId = uuidv4();
		await db.insert(roles).values({
			uid: superUserRoleId,
			roleName: "SuperUser",
			description: "Highest level role; full organization control",
			active: true,
			dateCreated: new Date().toISOString(),
			lastEdit: new Date().toISOString(),
			locked: false,
		});
	}

	// Create user with direct role assignment
	await db.insert(users).values({
		uid: userUid,
		firstName: userCreation.firstName,
		surname: userCreation.lastName,
		username: userCreation.username,
		secretKey: userCreation.password, // Store password directly in secretKey field
		orgid: organizationUid,
		roleId: superUserRoleId, // Direct role assignment
		active: true,
		dateCreated: new Date().toISOString(),
		lastEdit: new Date().toISOString(),
		locked: false,
		title: null,
		cellNo: null,
		email: null,
		loginKey: null,
	});

	return { success: true };
}
