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

    // Fetch user roles using $queryRaw
    const userRoles = await prisma.$queryRaw`
        SELECT 
        ur.uid,
        r.uid AS role_uid,
        r.role_name,
        r.description
      FROM 
        user_roles AS ur
      JOIN 
        roles AS r ON ur.roleid = r.uid
      WHERE 
        ur.userid = ${uid}::uuid AND
        ur.orgid = ${session.user.orgId}::uuid AND
        ur.active = true
    ` || []  // Default to empty array if null

    // Transform the result to match the expected shape, handling null case
    const roles = Array.isArray(userRoles) 
      ? userRoles.map((ur: any) => ({
          uid: ur.role_uid,
          role_name: ur.role_name,
          description: ur.description
        }))
      : []

    return NextResponse.json(roles)
  } catch (error) {
    if (error) {
        console.error('Failed to fetch user roles:', error)
      } else {
        console.error('Failed to fetch user roles: Unknown error')
      }
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

        console.log("Adding Role");

      // Check for existing role (active or inactive)
      const existingRole = await prisma.user_roles.findFirst({
        where: {
          userid: uid,
          roleid: roleIds[0],
          orgid: session.user.orgId,
        }
      })

      console.log("Existing Role:", existingRole);

      if (existingRole) {
        // Update existing role to active

        console.log("Updating Existing Role");
        await prisma.user_roles.update({
          where: {
            uid: existingRole.uid
          },
          data: {
            active: true,
            last_edit: new Date()
          }
        })

        console.log("Existing Role Updated");

      } else {

        console.log("Creating New Role");
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

        console.log("New Role Created");
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