"use server"

import { adminService } from "@/lib/services/admin-service";
import { revalidatePath } from "next/cache";

export async function addUserAction(formData: FormData) {
    const email = formData.get("email") as string;
    const accessStart = formData.get("accessStart") as string;
    const accessEnd = formData.get("accessEnd") as string;
    
    if (!email) return { error: "Email is required" };

    const success = await adminService.addUser(email, 'user', accessStart, accessEnd);
    if (success) {
        revalidatePath("/admin");
        return { success: true };
    }
    return { error: "Failed to authorize user" };
}

export async function toggleUserStatusAction(email: string, currentStatus: 'active' | 'inactive') {
    const success = await adminService.toggleUserStatus(email, currentStatus);
    if (success) {
        revalidatePath("/admin");
        return { success: true };
    }
    return { error: "Failed to update status" };
}

export async function deleteUserAction(email: string) {
    const success = await adminService.deleteUser(email);
    if (success) {
        revalidatePath("/admin");
        return { success: true };
    }
    return { error: "Failed to delete user" };
}

export async function toggleUserExclusionAction(email: string, jobType: string) {
    const success = await adminService.toggleUserExclusion(email, jobType);
    if (success) {
        revalidatePath("/admin");
        return { success: true };
    }
    return { error: `Failed to update ${jobType} exclusion` };
}
