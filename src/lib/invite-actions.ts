"use server";

import { getSession } from "./auth-actions";
import { prisma } from "./auth";
import { revalidatePath } from "next/cache";

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
