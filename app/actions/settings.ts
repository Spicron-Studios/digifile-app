"use server";

import { auth } from "@/app/lib/auth";
import db, { organizationInfo } from "@/app/lib/drizzle";
import { and, eq } from "drizzle-orm";

export type OrganizationInfo = {
	uid: string;
	practice_name: string | null;
	practice_type: string | null;
	bhf_number: string | null;
	hpcsa: string | null;
	vat_no: string | null;
	address: string | null;
	postal: string | null;
	practice_telephone: string | null;
	accounts_telephone: string | null;
	cell: string | null;
	fax: string | null;
	email: string | null;
};

export async function getOrganization(): Promise<OrganizationInfo | null> {
	const session = await auth();
	if (!session?.user?.orgId) return null;

	const results = await db
		.select({
			uid: organizationInfo.uid,
			practice_name: organizationInfo.practiceName,
			practice_type: organizationInfo.practiceType,
			bhf_number: organizationInfo.bhfNumber,
			hpcsa: organizationInfo.hpcsa,
			vat_no: organizationInfo.vatNo,
			address: organizationInfo.address,
			postal: organizationInfo.postal,
			practice_telephone: organizationInfo.practiceTelephone,
			accounts_telephone: organizationInfo.accountsTelephone,
			cell: organizationInfo.cell,
			fax: organizationInfo.fax,
			email: organizationInfo.email,
		})
		.from(organizationInfo)
		.where(
			and(
				eq(organizationInfo.uid, session.user.orgId),
				eq(organizationInfo.active, true),
			),
		)
		.limit(1);

	return results.length > 0 ? (results[0] as OrganizationInfo) : null;
}

export async function updateOrganization(
	input: Partial<OrganizationInfo>,
): Promise<OrganizationInfo> {
	const session = await auth();
	if (!session?.user?.orgId) throw new Error("Unauthorized");

	const updated = await db
		.update(organizationInfo)
		.set({
			practiceName: input.practice_name ?? undefined,
			practiceType: input.practice_type ?? undefined,
			bhfNumber: input.bhf_number ?? undefined,
			hpcsa: input.hpcsa ?? undefined,
			vatNo: input.vat_no ?? undefined,
			address: input.address ?? undefined,
			postal: input.postal ?? undefined,
			practiceTelephone: input.practice_telephone ?? undefined,
			accountsTelephone: input.accounts_telephone ?? undefined,
			cell: input.cell ?? undefined,
			fax: input.fax ?? undefined,
			email: input.email ?? undefined,
			lastEdit: new Date().toISOString(),
		})
		.where(eq(organizationInfo.uid, session.user.orgId))
		.returning({
			uid: organizationInfo.uid,
			practice_name: organizationInfo.practiceName,
			practice_type: organizationInfo.practiceType,
			bhf_number: organizationInfo.bhfNumber,
			hpcsa: organizationInfo.hpcsa,
			vat_no: organizationInfo.vatNo,
			address: organizationInfo.address,
			postal: organizationInfo.postal,
			practice_telephone: organizationInfo.practiceTelephone,
			accounts_telephone: organizationInfo.accountsTelephone,
			cell: organizationInfo.cell,
			fax: organizationInfo.fax,
			email: organizationInfo.email,
		});

	if (updated.length === 0) {
		throw new Error("Failed to update organization");
	}

	return updated[0] as OrganizationInfo;
}
