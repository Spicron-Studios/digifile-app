import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { auth } from '@/app/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized - No organization ID found' },
        { status: 401 }
      )
    }

    const data = await request.json()
    if (!data) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    if (params.uid !== session.user.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized - Organization ID mismatch' },
        { status: 403 }
      )
    }

    const updatedOrg = await prisma.organization_info.update({
      where: {
        uid: session.user.orgId
      },
      data: {
        practice_name: data.practice_name ?? undefined,
        practice_type: data.practice_type ?? undefined,
        bhf_number: data.bhf_number ?? undefined,
        hpcsa: data.hpcsa ?? undefined,
        vat_no: data.vat_no ?? undefined,
        address: data.address ?? undefined,
        postal: data.postal ?? undefined,
        practice_telephone: data.practice_telephone ?? undefined,
        accounts_telephone: data.accounts_telephone ?? undefined,
        cell: data.cell ?? undefined,
        fax: data.fax ?? undefined,
        email: data.email ?? undefined,
        last_edit: new Date()
      }
    })

    return NextResponse.json(updatedOrg)
  } catch (error) {
    console.error('Failed to update organization:', error)
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    )
  }
} 