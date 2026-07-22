import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// TEMPORARY DEBUG ENDPOINT - list all users
// DELETE THIS AFTER DEBUGGING
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isDeleted: true,
        role: true,
        organizationId: true
      },
      take: 20
    });

    return NextResponse.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
