import { AdminService } from './lib/services/admin-service';

async function testWhitelist() {
    const admin = new AdminService();
    const mockEmail = "test-user@example.com";
    
    console.log("--- Testing Whitelist Date Logic ---");
    
    const now = new Date();
    
    // Case 1: Active Window
    const rowsActive = [[mockEmail, "user", "active", now.toISOString(), "2026-04-11", "2026-04-30"]];
    const isActive = checkLogic(mockEmail, rowsActive, now);
    console.log(`User in range (Apr 11-30) on ${now.toDateString()}: ${isActive ? "✅ PASS (Allowed)" : "❌ FAIL (Blocked)"}`);

    // Case 2: Past Window (Expired)
    const rowsExpired = [[mockEmail, "user", "active", now.toISOString(), "2026-04-01", "2026-04-10"]];
    const isExpired = checkLogic(mockEmail, rowsExpired, now);
    console.log(`User expired (Apr 1-10) on ${now.toDateString()}: ${!isExpired ? "✅ PASS (Blocked)" : "❌ FAIL (Allowed)"}`);

    // Case 3: Future Window (Pending)
    const rowsPending = [[mockEmail, "user", "active", now.toISOString(), "2026-04-20", "2026-04-30"]];
    const isPending = checkLogic(mockEmail, rowsPending, now);
    console.log(`User pending (Apr 20-30) on ${now.toDateString()}: ${!isPending ? "✅ PASS (Blocked)" : "❌ FAIL (Allowed)"}`);

    // Case 4: Last second of Expiry
    const expiryDate = new Date("2026-04-12");
    const testTime = new Date("2026-04-12T23:59:58Z");
    const rowsEdge = [[mockEmail, "user", "active", now.toISOString(), "2026-04-10", "2026-04-12"]];
    const isEdgeAllowed = checkLogic(mockEmail, rowsEdge, testTime);
    console.log(`User at 11:59:58 PM on Expiry Day: ${isEdgeAllowed ? "✅ PASS (Allowed)" : "❌ FAIL (Blocked)"}`);
}

// Extracting the core logic from isWhitelisted for isolated testing
function checkLogic(email: string, rows: any[], now: Date) {
    return rows.some((row: string[]) => {
        const rowEmail = row[0]?.toLowerCase();
        const status = (row[2]?.toLowerCase() || 'active');
        const accessStart = row[4] ? new Date(row[4]) : null;
        const accessEnd = row[5] ? new Date(row[5]) : null;

        if (rowEmail !== email.toLowerCase() || status !== 'active') return false;
        if (accessStart && now < accessStart) return false;
        if (accessEnd) {
            const endOfDay = new Date(accessEnd);
            endOfDay.setHours(23, 59, 59, 999);
            if (now > endOfDay) return false;
        }
        return true;
    });
}

testWhitelist();
