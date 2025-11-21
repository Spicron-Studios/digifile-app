import { z } from "zod";

/**
 * Common validation schemas
 */
export const UuidSchema = z.string().uuid("Invalid UUID format");
export const EmailSchema = z.string().email("Invalid email format");

/**
 * Organization-related schemas
 */
export const OrganizationSchema = z.object({
	uid: UuidSchema,
	practice_name: z.string().min(1),
	practice_type: z.string().optional().nullable(),
	bhf_number: z.string().optional().nullable(),
	hpcsa: z.string().optional().nullable(),
	vat_no: z.string().optional().nullable(),
	address: z.string().optional().nullable(),
	postal: z.string().optional().nullable(),
	practice_telephone: z.string().optional().nullable(),
	accounts_telephone: z.string().optional().nullable(),
	cell: z.string().optional().nullable(),
	fax: z.string().optional().nullable(),
	email: EmailSchema.optional().nullable(),
	active: z.boolean().optional(),
	date_created: z.date().optional(),
	last_edit: z.date().optional(),
});

/**
 * Validation helper functions
 */
export function validateWithSchema<T>(schema: z.ZodSchema<T>) {
	return (data: unknown): T => {
		const result = schema.safeParse(data);
		if (!result.success) {
			throw new Error(
				`Validation error: ${result.error.errors.map((e) => e.message).join(", ")}`,
			);
		}
		return result.data;
	};
}

/**
 * Common validators
 */
export const validateOrganization = validateWithSchema(OrganizationSchema);
