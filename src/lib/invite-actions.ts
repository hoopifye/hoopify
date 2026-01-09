"use server";

import { getSession } from "./auth-actions";
import { prisma } from "./auth";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

// Generate a unique token for invite links
function generateInviteToken(): string {
    return randomBytes(32).toString("hex");
}

export async function createInviteLinkAction(calendarId: string, role: string = "VIEWER") {
    const session = await getSession();
    if (!session?.user?.id) return { error: "Not authenticated" };

    try {
        // Check if user has permission to create invite links (must be OWNER or EDITOR)
        const member = await prisma.calendarMember.findUnique({
            where: { calendarId_userId: { calendarId, userId: session.user.id } },
        });

        if (!member || (member.role !== "OWNER" && member.role !== "EDITOR")) {
            return { error: "You don't have permission to create invite links" };
        }

        // Get calendar details
        const calendar = await prisma.calendar.findUnique({
            where: { id: calendarId },
            select: { name: true },
        });

        if (!calendar) return { error: "Calendar not found" };

        // Generate unique token
        const token = generateInviteToken();

        // Create invite with token (no email - it's a link invite)
        await prisma.invite.create({
            data: {
                email: null,
                senderId: session.user.id,
                resourceId: calendarId,
                resourceType: "CALENDAR",
                role,
                token,
                status: "PENDING",
            },
        });

        return { success: true, token };
    } catch (err) {
        console.error("Failed to create invite link:", err);
        return { error: "Failed to create invite link" };
    }
}

export async function acceptInviteLinkAction(token: string) {
    const session = await getSession();
    if (!session?.user?.id) return { error: "Not authenticated", needsAuth: true };

    try {
        // Find invite by token
        const invite = await prisma.invite.findUnique({
            where: { token },
            include: {
                sender: { select: { name: true } },
            },
        });

        if (!invite) return { error: "Invalid or expired invite link" };
        if (invite.status !== "PENDING") return { error: "This invite link has already been used" };

        // Check if user is already a member
        if (invite.resourceType === "CALENDAR") {
            const existingMember = await prisma.calendarMember.findUnique({
                where: { calendarId_userId: { calendarId: invite.resourceId, userId: session.user.id } },
            });

            if (existingMember) {
                return { error: "You are already a member of this calendar" };
            }

            // Get calendar name for response
            const calendar = await prisma.calendar.findUnique({
                where: { id: invite.resourceId },
                select: { name: true },
            });

            // Add user as member
            await prisma.$transaction(async (tx) => {
                await tx.calendarMember.create({
                    data: {
                        calendarId: invite.resourceId,
                        userId: session.user.id!,
                        role: invite.role as any,
                        addedByUserId: invite.senderId,
                    },
                });

                // Mark invite as accepted (but keep the token valid for others to use)
                // Actually, for a shared link we may want to keep it open
                // Let's NOT mark it as accepted so multiple people can use the same link
            });

            revalidatePath("/calendar");
            return { 
                success: true, 
                calendarName: calendar?.name || "Unknown",
                role: invite.role,
            };
        } else if (invite.resourceType === "PROJECT") {
            const existingMember = await prisma.projectMember.findUnique({
                where: { projectId_userId: { projectId: invite.resourceId, userId: session.user.id } },
            });

            if (existingMember) {
                return { error: "You are already a member of this project" };
            }

            const project = await prisma.project.findUnique({
                where: { id: invite.resourceId },
                select: { name: true },
            });

            await prisma.projectMember.create({
                data: {
                    projectId: invite.resourceId,
                    userId: session.user.id!,
                    role: invite.role as any,
                },
            });

            revalidatePath("/calendar");
            return { 
                success: true, 
                projectName: project?.name || "Unknown",
                role: invite.role,
            };
        }

        return { error: "Unknown resource type" };
    } catch (err) {
        console.error("Failed to accept invite link:", err);
        return { error: "Failed to join" };
    }
}

export async function getInviteLinkDetailsAction(token: string) {
    try {
        const invite = await prisma.invite.findUnique({
            where: { token },
            include: {
                sender: { select: { name: true, image: true } },
            },
        });

        if (!invite) return { error: "Invalid or expired invite link" };
        if (invite.status !== "PENDING") return { error: "This invite link is no longer valid" };

        let resourceName = "Unknown";
        if (invite.resourceType === "CALENDAR") {
            const calendar = await prisma.calendar.findUnique({
                where: { id: invite.resourceId },
                select: { name: true },
            });
            if (calendar) resourceName = calendar.name;
        } else if (invite.resourceType === "PROJECT") {
            const project = await prisma.project.findUnique({
                where: { id: invite.resourceId },
                select: { name: true },
            });
            if (project) resourceName = project.name;
        }

        return {
            resourceName,
            resourceType: invite.resourceType,
            role: invite.role,
            senderName: invite.sender.name,
            senderImage: invite.sender.image,
        };
    } catch (err) {
        console.error("Failed to get invite details:", err);
        return { error: "Failed to get invite details" };
    }
}

export async function getPendingInvitesAction() {
    const session = await getSession();
    if (!session?.user?.email) return { error: "Not authenticated", invites: [] };

    try {
        const invites = await prisma.invite.findMany({
            where: {
                email: session.user.email,
                status: "PENDING",
            },
            include: {
                sender: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        // We need to fetch the resource names since we only have IDs
        const enrichedInvites = await Promise.all(
            invites.map(async (invite) => {
                let resourceName = "Unknown";
                if (invite.resourceType === "CALENDAR") {
                    const calendar = await prisma.calendar.findUnique({
                        where: { id: invite.resourceId },
                        select: { name: true },
                    });
                    if (calendar) resourceName = calendar.name;
                } else if (invite.resourceType === "PROJECT") {
                    const project = await prisma.project.findUnique({
                        where: { id: invite.resourceId },
                        select: { name: true },
                    });
                    if (project) resourceName = project.name;
                }

                return {
                    id: invite.id,
                    senderName: invite.sender.name,
                    resourceName,
                    resourceType: invite.resourceType === "CALENDAR" ? "Calendar" : "Project",
                    inviteDate: invite.createdAt,
                    roleOffered: invite.role,
                    status: invite.status,
                };
            })
        );

        return { invites: enrichedInvites };
    } catch (err) {
        console.error("Failed to fetch invites:", err);
        return { error: "Failed to fetch invites", invites: [] };
    }
}

export async function acceptInviteAction(inviteId: string) {
    const session = await getSession();
    if (!session?.user?.id || !session?.user?.email) return { error: "Not authenticated" };

    try {
        const invite = await prisma.invite.findUnique({
            where: { id: inviteId },
        });

        if (!invite) return { error: "Invitation not found" };
        if (invite.email !== session.user.email) return { error: "This invitation is not for you" };
        if (invite.status !== "PENDING") return { error: "Invitation is no longer pending" };

        // Start a transaction
        await prisma.$transaction(async (tx) => {
            // Update invite status
            await tx.invite.update({
                where: { id: inviteId },
                data: { status: "ACCEPTED" },
            });

            if (invite.resourceType === "CALENDAR") {
                await tx.calendarMember.create({
                    data: {
                        calendarId: invite.resourceId,
                        userId: session.user.id!,
                        role: invite.role as any,
                        addedByUserId: invite.senderId,
                    },
                });
            } else if (invite.resourceType === "PROJECT") {
                await tx.projectMember.create({
                    data: {
                        projectId: invite.resourceId,
                        userId: session.user.id!,
                        role: invite.role as any,
                    },
                });
            }
        });

        revalidatePath("/invites");
        revalidatePath("/calendar");
        return { success: true };
    } catch (err) {
        console.error("Failed to accept invite:", err);
        return { error: (err as any)?.message || "Failed to accept invitation" };
    }
}

export async function declineInviteAction(inviteId: string) {
    const session = await getSession();
    if (!session?.user?.id || !session?.user?.email) return { error: "Not authenticated" };

    try {
        const invite = await prisma.invite.findUnique({
            where: { id: inviteId },
        });

        if (!invite) return { error: "Invitation not found" };
        if (invite.email !== session.user.email) return { error: "This invitation is not for you" };

        await prisma.invite.update({
            where: { id: inviteId },
            data: { status: "DECLINED" },
        });

        revalidatePath("/invites");
        return { success: true };
    } catch (err) {
        console.error("Failed to decline invite:", err);
        return { error: (err as any)?.message || "Failed to decline invitation" };
    }
}

export async function getPendingInvitesCountAction() {
    const session = await getSession();
    if (!session?.user?.email) return 0;

    try {
        const count = await prisma.invite.count({
            where: {
                email: session.user.email,
                status: "PENDING",
            },
        });
        return count;
    } catch (err) {
        console.error("Failed to fetch invite count:", err);
        return 0;
    }
}
