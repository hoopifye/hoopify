"use server";

import { getSession } from "./auth-actions";
import { prisma } from "./auth";
import { revalidatePath } from "next/cache";

export async function updateUsernameAction(formData: FormData) {
    const name = formData.get("name") as string;
    if (!name || name.trim().length === 0) {
        throw new Error("Name is required");
    }

    const session = await getSession();
    if (!session?.user?.id) throw new Error("Not authenticated");

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { name: name.trim() },
        });
        revalidatePath("/settings");
    } catch (err: any) {
        throw new Error(err?.message || "Failed to update name");
    }
}

export async function updateAvatarAction(formData: FormData) {
    const image = formData.get("image") as string;
    if (!image) throw new Error("Image URL is required");

    const session = await getSession();
    if (!session?.user?.id) throw new Error("Not authenticated");

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { image: image.trim() },
        });
        revalidatePath("/settings");
    } catch (err: any) {
        throw new Error(err?.message || "Failed to update avatar");
    }
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
        include: { addedByUser: true },
    });

    if (!currentMember) return { error: "You are not a member of this calendar" };

    // Get target member to check their details
    const targetMember = await prisma.calendarMember.findUnique({
        where: { calendarId_userId: { calendarId, userId: targetUserId } },
        include: { addedByUser: true },
    });

    if (!targetMember) return { error: "Target user is not a member of this calendar" };

    // If current user is calendar OWNER -> allow any change
    if (currentMember.role === "OWNER") {
        // Owner can do anything
    } else if (currentMember.role === "EDITOR") {
        // Editor can only modify non-owner members
        if (targetMember.role === "OWNER") {
            return { error: "Cannot modify owner permissions" };
        }
        // Editor cannot revoke other editors if they were added by owner
        if (targetMember.role === "EDITOR" && targetMember.addedByUser?.id !== session.user.id) {
            return { error: "Cannot modify editors added by owner" };
        }
    } else {
        return { error: "Insufficient permissions" };
    }

    try {
        // Do not allow ownership transfer through this action
        // Use transferCalendarOwnershipAction instead
        if (role === "OWNER") {
            return { error: "Use transfer ownership function for ownership changes" };
        }

        await prisma.calendarMember.updateMany({
            where: { calendarId, userId: targetUserId },
            data: { role: role as any },
        });
        revalidatePath("/settings");
    } catch (err: any) {
        return { error: err?.message || "Failed to update member role" };
    }

    return { success: true };
}

export async function transferCalendarOwnershipAction(formData: FormData) {
    const calendarId = formData.get("calendarId") as string;
    const newOwnerId = formData.get("newOwnerId") as string;

    if (!calendarId || !newOwnerId) return { error: "Missing calendar ID or new owner ID" };

    const session = await getSession();
    if (!session?.user?.id) return { error: "Not authenticated" };

    try {
        // Verify current user is the owner
        const currentOwner = await prisma.calendarMember.findUnique({
            where: { calendarId_userId: { calendarId, userId: session.user.id } },
        });

        if (!currentOwner) return { error: "You are not a member of this calendar" };
        if (currentOwner.role !== "OWNER") return { error: "Only owners can transfer ownership" };

        // Verify new owner exists and is a member
        const newOwner = await prisma.calendarMember.findUnique({
            where: { calendarId_userId: { calendarId, userId: newOwnerId } },
        });

        if (!newOwner) return { error: "New owner is not a member of this calendar" };

        // Atomic transaction: new owner becomes OWNER, current owner becomes EDITOR
        await prisma.$transaction([
            prisma.calendarMember.update({
                where: { calendarId_userId: { calendarId, userId: newOwnerId } },
                data: { role: "OWNER" },
            }),
            prisma.calendarMember.update({
                where: { calendarId_userId: { calendarId, userId: session.user.id } },
                data: { role: "EDITOR" },
            }),
        ]);

        revalidatePath("/settings");
        return { success: true };
    } catch (err: any) {
        return { error: err?.message || "Failed to transfer ownership" };
    }
}

export async function removeCalendarMemberAction(formData: FormData) {
    const calendarId = formData.get("calendarId") as string;
    const targetUserId = formData.get("targetUserId") as string;

    if (!calendarId || !targetUserId) return { error: "Missing data" };

    const session = await getSession();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // get current user's membership for this calendar
    const currentMember = await prisma.calendarMember.findUnique({
        where: { calendarId_userId: { calendarId, userId: session.user.id } },
        include: { addedByUser: true },
    });

    if (!currentMember) return { error: "You are not a member of this calendar" };

    // Get target member to check their details
    const targetMember = await prisma.calendarMember.findUnique({
        where: { calendarId_userId: { calendarId, userId: targetUserId } },
        include: { addedByUser: true },
    });

    if (!targetMember) return { error: "Target user is not a member of this calendar" };

    // If current user is calendar OWNER -> allow any change
    if (currentMember.role === "OWNER") {
        // Owner can remove anyone (except they shouldn't remove themselves, but let the DB constraint handle that)
    } else if (currentMember.role === "EDITOR") {
        // Editor can only remove non-owner members
        if (targetMember.role === "OWNER") {
            return { error: "Cannot remove owner" };
        }
        // Editor cannot remove other editors if they were added by owner
        if (targetMember.role === "EDITOR" && targetMember.addedByUser?.id !== session.user.id) {
            return { error: "Cannot remove editors added by owner" };
        }
    } else {
        return { error: "Insufficient permissions" };
    }

    try {
        await prisma.calendarMember.deleteMany({
            where: { calendarId, userId: targetUserId },
        });
        revalidatePath("/settings");
    } catch (err: any) {
        return { error: err?.message || "Failed to remove member" };
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
        revalidatePath("/settings");
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
        revalidatePath("/settings");
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
                image: true,
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
    // Validate role is a valid CalendarRole
    if (!["OWNER", "EDITOR", "VIEWER"].includes(role)) {
        return { error: "Invalid role" };
    }

    if (!calendarId || !userEmail) return { error: "Missing required data" };

    const session = await getSession();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Check if current user has permission
    const currentMember = await prisma.calendarMember.findUnique({
        where: { calendarId_userId: { calendarId, userId: session.user.id } },
    });

    if (!currentMember || (currentMember.role !== "OWNER" && currentMember.role !== "EDITOR")) {
        return { error: "Only calendar owners and editors can add members" };
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
