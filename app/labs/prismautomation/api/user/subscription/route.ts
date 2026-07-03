/**
 * GET /api/user/subscription
 * Returns the logged-in user's subscription window (from admin whitelist)
 */
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { adminService } from "@/lib/services/admin-service";

export async function GET() {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const users = await adminService.getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            return NextResponse.json({ subscription: null });
        }

        return NextResponse.json({
            subscription: {
                status: user.status,
                accessStart: user.accessStart || null,
                accessEnd: user.accessEnd || null,
                role: user.role,
            }
        });
    } catch {
        return NextResponse.json({ subscription: null });
    }
}
