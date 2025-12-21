"use server";

import { prisma } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { revalidatePath } from "next/cache";

export async function createEvent(data: {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: "REMINDER" | "EVENT" | "PROJECT";
  checklist?: string[];
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      type: data.type,
      checklist: {
        create: data.checklist?.map((text) => ({ text })) || [],
      },
      participants: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
  });

  revalidatePath("/calendar");
  return event;
}

export async function getEvents(startDate: Date, endDate: Date) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return [];
  }

  const events = await prisma.event.findMany({
    where: {
      participants: {
        some: {
          userId: session.user.id,
        },
      },
      startDate: {
        gte: startDate,
      },
      endDate: {
        lte: endDate,
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  return events;
}
