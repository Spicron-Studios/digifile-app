import { NextResponse } from 'next/server';
import db, { organizationInfo, users } from '@/app/lib/drizzle';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const organizationUid = uuidv4();

    // Create organization
    await db
      .insert(organizationInfo)
      .values({
        uid: organizationUid,
        practiceName: data.practiceInfo.practiceName,
        bhfNumber: data.practiceInfo.bhfNumber,
        hpcsa: data.practiceInfo.hpcsaNumber,
        practiceType: data.practiceInfo.practiceType,
        vatNo: data.practiceInfo.vatNumber,
        practiceTelephone: data.contactDetails.practiceTelephone,
        accountsTelephone: data.contactDetails.accountsTelephone,
        postal: data.contactDetails.postalCode,
        address: data.contactDetails.fullAddress,
        email: data.contactDetails.practiceEmail,
        cell: data.contactDetails.cellNumber,
        fax: data.contactDetails.fax,
        active: true,
        dateCreated: new Date(),
        lastEdit: new Date(),
        locked: false,
        consentToTreatment: null,
        consentToFinancialResponsibility: null,
        consentToReleaseOfInformation: null,
      })
      .returning();

    // Create user with direct password storage (no hashing for now)
    await db.insert(users).values({
      uid: uuidv4(),
      firstName: data.userCreation.firstName,
      surname: data.userCreation.lastName,
      username: data.userCreation.username,
      secretKey: data.userCreation.password, // Store password directly in secretKey field
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
