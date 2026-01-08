"use server";

import { getSession } from "./auth-actions";
import { prisma } from "./auth";

export async function updateUsernameAction(formData: FormData) {
    const name = formData.get("name") as string;
    if (!name || name.trim().length === 0) {
        return { error: "Name is required" };
    }

    const session = await getSession();
    if (!session?.user?.id) return { error: "Not authenticated" };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { name: name.trim() },
        });
    } catch (err: any) {
        return { error: err?.message || "Failed to update name" };
    }

    return { success: true };
}

export async function updateAvatarAction(formData: FormData) {
    const image = formData.get("image") as string;
    if (!image) return { error: "Image URL is required" };

    const session = await getSession();
    if (!session?.user?.id) return { error: "Not authenticated" };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { image: image.trim() },
        });
    } catch (err: any) {
        return { error: err?.message || "Failed to update avatar" };
    }

    return { success: true };
}

export async function changeCalendarMemberRoleAction(formData: FormData) {
    const calendarId = formData.get("calendarId") as string;
    const targetUserId = formData.get("targetUserId") as string;
    const role = formData.get("role") as string; // OWNER | EDITOR | VIEWER

    if (!calendarId || !targetUserId || !role) return { error: "Missing data" };

    const session = await getSession();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // get current user's membership for this calendar
    const currentMember = await prisma.calendarMember.findUnique({
        where: { calendarId_userId: { calendarId, userId: session.user.id } },
    });

    if (!currentMember) return { error: "You are not a member of this calendar" };

    // If current user is calendar OWNER -> allow any change
    if (currentMember.role === "OWNER") {
        // allowed
    } else {
        // Not owner: if user has site-level ADMIN role they can change members except other site ADMINs
        const sessionUser = session.user as any;
        if (sessionUser.role === "ADMIN") {
            const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
            if (!targetUser) return { error: "Target user not found" };
            if (targetUser.role === "ADMIN") return { error: "Cannot change roles for other admins" };
            // admins cannot assign OWNER role (only calendar owners should)
            if (role === "OWNER") return { error: "Only calendar owners can assign OWNER" };
            // allowed otherwise
        } else {
            return { error: "Insufficient permissions" };
        }
    }

    try {
        await prisma.calendarMember.updateMany({
            where: { calendarId, userId: targetUserId },
            data: { role: role as any },
        });
    } catch (err: any) {
        return { error: err?.message || "Failed to update member role" };
    }

    return { success: true };
}

export async function leaveCalendarAction(formData: FormData) {
    const calendarId = formData.get("calendarId") as string;

    if (!calendarId) return { error: "Missing calendar ID" };

    const session = await getSession();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Check if user is a member
    const member = await prisma.calendarMember.findUnique({
        where: { calendarId_userId: { calendarId, userId: session.user.id } },
    });

    if (!member) return { error: "You are not a member of this calendar" };

    // Cannot leave if you're the owner
    if (member.role === "OWNER") {
        return { error: "Calendar owners cannot leave. Please transfer ownership first or delete the calendar." };
    }

    try {
        await prisma.calendarMember.delete({
            where: { calendarId_userId: { calendarId, userId: session.user.id } },
        });
    } catch (err: any) {
        return { error: err?.message || "Failed to leave calendar" };
    }

    return { success: true };
}

export async function deleteCalendarAction(formData: FormData) {
    const calendarId = formData.get("calendarId") as string;

    if (!calendarId) return { error: "Missing calendar ID" };

    const session = await getSession();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Check if user is the owner
    const member = await prisma.calendarMember.findUnique({
        where: { calendarId_userId: { calendarId, userId: session.user.id } },
    });

    if (!member) return { error: "You are not a member of this calendar" };

    if (member.role !== "OWNER") {
        return { error: "Only calendar owners can delete calendars" };
    }

    try {
        // Delete all events associated with this calendar
        await prisma.event.deleteMany({
            where: { calendarId },
        });

        // Delete all members
        await prisma.calendarMember.deleteMany({
            where: { calendarId },
        });

        // Delete the calendar itself
        await prisma.calendar.delete({
            where: { id: calendarId },
        });
    } catch (err: any) {
        return { error: err?.message || "Failed to delete calendar" };
    }

    return { success: true };
}

export async function searchUsersByEmailAction(email: string) {
    if (!email || email.trim().length === 0) return [];

    const session = await getSession();
    if (!session?.user?.id) return [];

    try {
        const users = await prisma.user.findMany({
            where: {
                email: {
                    contains: email.trim(),
                    mode: "insensitive",
                },
                id: { not: session.user.id }, // Don't include current user
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
            take: 5,
        });
        return users;
    } catch (err: any) {
        console.error("Failed to search users:", err);
        return [];
    }
}

export async function addCalendarMemberAction(formData: FormData) {
    const calendarId = formData.get("calendarId") as string;
    const userEmail = formData.get("userEmail") as string;
    const role = (formData.get("role") as string) || "VIEWER";

    if (!calendarId || !userEmail) return { error: "Missing required data" };

    const session = await getSession();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Check if current user has permission
    const currentMember = await prisma.calendarMember.findUnique({
        where: { calendarId_userId: { calendarId, userId: session.user.id } },
    });

    if (!currentMember || (currentMember.role !== "OWNER" && currentMember.role !== "ADMIN")) {
        return { error: "Only calendar owners and admins can add members" };
    }

    // Find user by email
    const targetUser = await prisma.user.findUnique({
        where: { email: userEmail },
    });

    if (!targetUser) return { error: "User not found" };

    // Check if user is already a member
    const existingMember = await prisma.calendarMember.findUnique({
        where: { calendarId_userId: { calendarId, userId: targetUser.id } },
    });

    if (existingMember) return { error: "User is already a member" };

    // Check if there is already a pending invite
    const existingInvite = await prisma.invite.findUnique({
        where: {
            email_resourceId_resourceType: {
                email: userEmail,
                resourceId: calendarId,
                resourceType: "CALENDAR",
            },
        },
    });

    if (existingInvite && existingInvite.status === "PENDING") {
        return { error: "An invitation is already pending for this user" };
    }

    try {
        await prisma.invite.upsert({
            where: {
                email_resourceId_resourceType: {
                    email: userEmail,
                    resourceId: calendarId,
                    resourceType: "CALENDAR",
                },
            },
            update: {
                role,
                status: "PENDING",
                senderId: session.user.id,
            },
            create: {
                email: userEmail,
                resourceId: calendarId,
                resourceType: "CALENDAR",
                role,
                status: "PENDING",
                senderId: session.user.id,
            },
        });
    } catch (err: any) {
        return { error: err?.message || "Failed to create invitation" };
    }

    return { success: true };
}
