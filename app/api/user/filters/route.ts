import { NextRequest, NextResponse } from 'next/server';
import { adminService } from '@/lib/services/admin-service';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json({ excludedTypes: [] });
    }

    const filters = await adminService.getUserFilters(userEmail);
    return NextResponse.json(filters);
  } catch (error) {
    console.error('Failed to fetch user filters:', error);
    return NextResponse.json({ excludedTypes: [] }, { status: 500 });
  }
}
