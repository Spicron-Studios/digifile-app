import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Create organization
    const organization = await prisma.organization_info.create({
      data: {
        uid: uuidv4(),
        practice_name: data.practiceInfo.practiceName,
        bhf_number: data.practiceInfo.bhfNumber,
        hpcsa: data.practiceInfo.hpcsaNumber,
        practice_type: data.practiceInfo.practiceType,
        vat_no: data.practiceInfo.vatNumber,
        practice_telephone: data.contactDetails.practiceTelephone,
        accounts_telephone: data.contactDetails.accountsTelephone,
        postal: data.contactDetails.postalCode,
        address: data.contactDetails.fullAddress,
        email: data.contactDetails.practiceEmail,
        cell: data.contactDetails.cellNumber,
        fax: data.contactDetails.fax,
        active: true,
        date_created: new Date(),
      },
    });

    // Create user
    const user = await prisma.users.create({
      data: {
        uid: uuidv4(),
        first_name: data.userCreation.firstName,
        surname: data.userCreation.lastName,
        username: data.userCreation.username,
        secret_key: data.userCreation.password, // Note: Should be hashed in production
        orgid: organization.uid,
        active: true,
        date_created: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
} 