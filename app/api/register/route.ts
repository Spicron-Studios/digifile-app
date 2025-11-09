import { Logger } from '@/app/lib/logger/logger.service';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { hash } from 'bcryptjs';
import db, { organizationInfo, users } from '@/app/lib/drizzle';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const organizationUid = uuidv4();

    // Create organization
    await db.insert(organizationInfo).values({
      uid: organizationUid,
      practiceName: data.practiceInfo.practiceName,
      practiceType: data.practiceInfo.practiceType,
      vatNo: data.practiceInfo.vatNo,
      address: data.practiceInfo.address,
      postal: data.practiceInfo.postal,
      practiceTelephone: data.practiceInfo.practiceTelephone,
      accountsTelephone: data.practiceInfo.accountsTelephone,
      cell: data.practiceInfo.cell,
      fax: data.practiceInfo.fax,
      email: data.practiceInfo.email,
      active: true,
      dateCreated: new Date().toISOString(),
      lastEdit: new Date().toISOString(),
    });

    // Create user with direct password storage (no hashing for now)

    // Hash the password
    const hashedPassword = await hash(data.userCreation.password, 10);

    // Create the user record
    await db.insert(users).values({
      uid: uuidv4(),
      title: data.userCreation.title,
      firstName: data.userCreation.firstName,
      surname: data.userCreation.lastName,
      cellNo: data.userCreation.cellPhone,
      secretKey: hashedPassword,
      email: data.userCreation.email,
      username: data.userCreation.username,
      loginKey: data.userCreation.loginKey,
      active: true,
      dateCreated: new Date().toISOString(),
      lastEdit: new Date().toISOString(),
      orgid: organizationUid,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    try {
      const logger = Logger.getInstance();
      await logger.init();
      await logger.error(
        'api/register/route.ts',
        `Registration error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } catch (_loggingError) {
      // Silently fail - logger failed, cannot log
    }
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
