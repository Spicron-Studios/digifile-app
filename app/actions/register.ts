'use server';

import db, { organizationInfo, users } from '@/app/lib/drizzle';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Payload shapes sent from the registration client
const practiceInfoSchema = z.object({
  practiceName: z.string().min(1),
  bhfNumber: z.string().min(1),
  hpcsaNumber: z.string().optional().nullable(),
  practiceType: z.string().optional().nullable(),
  vatNumber: z.string().optional().nullable(),
});

const contactDetailsSchema = z.object({
  practiceTelephone: z.string().optional().nullable(),
  accountsTelephone: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  fullAddress: z.string().optional().nullable(),
  practiceEmail: z.string().email().optional().nullable(),
  cellNumber: z.string().optional().nullable(),
  fax: z.string().optional().nullable(),
});

const userCreationSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    username: z.string().min(1),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type RegisterPayload = {
  practiceInfo: z.infer<typeof practiceInfoSchema>;
  contactDetails: z.infer<typeof contactDetailsSchema>;
  userCreation: z.infer<typeof userCreationSchema>;
  // extraInfo is intentionally ignored at this stage
};

export async function registerOrganization(
  payload: RegisterPayload
): Promise<{ success: true }> {
  const practiceInfo = practiceInfoSchema.parse(payload.practiceInfo);
  const contactDetails = contactDetailsSchema.parse(payload.contactDetails);
  const userCreation = userCreationSchema.parse(payload.userCreation);

  const organizationUid = uuidv4();

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
    dateCreated: new Date(),
    lastEdit: new Date(),
    locked: false,
    consentToTreatment: null,
    consentToFinancialResponsibility: null,
    consentToReleaseOfInformation: null,
  });

  // Create user with direct password storage (no hashing for now)
  await db.insert(users).values({
    uid: uuidv4(),
    firstName: userCreation.firstName,
    surname: userCreation.lastName,
    username: userCreation.username,
    secretKey: userCreation.password, // Store password directly in secretKey field
    orgid: organizationUid,
    active: true,
    dateCreated: new Date(),
    lastEdit: new Date(),
    locked: false,
    title: null,
    cellNo: null,
    email: null,
    loginKey: null,
  });

  return { success: true };
}
