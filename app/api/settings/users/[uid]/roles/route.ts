import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { auth } from '@/app/lib/auth'

// Get roles for a specific user
export async function GET(
  request: NextRequest,
  context: { params: { uid: string } }
) {
  try {
    const { uid } = await Promise.resolve(context.params)
    
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user roles
    const userRoles = await prisma.user_roles.findMany({
      where: {
        userid: uid,
        orgid: session.user.orgId,
        active: true
      },
      include: {
        roles: {
          select: {
            uid: true,
            role_name: true,
            description: true
          }
        }
      }
    })

    // Transform the result to return just the role details
    const roles = userRoles
      .map(ur => ur.roles)
      .filter((role): role is NonNullable<typeof role> => role !== null)

    // Return empty array if no roles found
    return NextResponse.json(roles.length ? roles : [])
  } catch (error) {
    console.error('Failed to fetch user roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user roles' },
      { status: 500 }
    )
  }
}

// Add or remove roles for a user
export async function PUT(
  request: NextRequest,
  context: { params: { uid: string } }
) {
  try {
    const { uid } = await Promise.resolve(context.params)
    
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { roleIds, action } = await request.json()

    if (!Array.isArray(roleIds) || !['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    if (action === 'add') {
      // Check for existing role (active or inactive)
      const existingRole = await prisma.user_roles.findFirst({
        where: {
          userid: uid,
          roleid: roleIds[0],
          orgid: session.user.orgId,
        }
      })

      if (existingRole) {
        // Update existing role to active
        await prisma.user_roles.update({
          where: {
            uid: existingRole.uid
          },
          data: {
            active: true,
            last_edit: new Date()
          }
        })
      } else {
        // Create new user role record
        await prisma.user_roles.create({
          data: {
            uid: crypto.randomUUID(),
            userid: uid,
            roleid: roleIds[0],
            orgid: session.user.orgId,
            active: true,
            date_created: new Date(),
            last_edit: new Date(),
            locked: false
          }
        })
      }
    } else {
      // Set role to inactive
      await prisma.user_roles.updateMany({
        where: {
          userid: uid,
          roleid: { in: roleIds },
          orgid: session.user.orgId,
          active: true
        },
        data: {
          active: false,
          last_edit: new Date()
        }
      })
    }

    // Fetch updated roles with role details
    const updatedUserRoles = await prisma.user_roles.findMany({
      where: {
        userid: uid,
        orgid: session.user.orgId,
        active: true
      },
      include: {
        roles: true
      }
    })

    // Transform the result to return just the role details
    const roles = updatedUserRoles
      .map(ur => ({
        uid: ur.roles?.uid || '',
        role_name: ur.roles?.role_name || '',
        description: ur.roles?.description || null
      }))
      .filter(role => role.uid !== '')

    return NextResponse.json(roles)

  } catch (error) {
    console.error('Failed to update user roles:', error)
    return NextResponse.json(
      { error: 'Failed to update user roles' },
      { status: 500 }
    )
  }
} 