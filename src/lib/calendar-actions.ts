"use server";

import { prisma } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { revalidatePath } from "next/cache";

export async function createCalendar(data: {
  name: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const calendar = await prisma.calendar.create({
    data: {
      name: data.name,
      description: data.description,
      color: data.color || "#3b82f6",
      isDefault: data.isDefault || false,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
  });

  revalidatePath("/calendar");
  return calendar;
}

export async function getOrCreateDefaultCalendar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Check if user has a default calendar
  const existingDefault = await prisma.calendar.findFirst({
    where: {
      isDefault: true,
      members: {
        some: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
  });

  if (existingDefault) {
    return existingDefault;
  }

  // Create default calendar
  const defaultCalendar = await prisma.calendar.create({
    data: {
      name: "My Calendar",
      isDefault: true,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
  });

  return defaultCalendar;
}

export async function createEvent(data: {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: "REMINDER" | "EVENT";
  calendarId: string;
  checklist?: string[];
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Verify user has access to the calendar
  const calendarMember = await prisma.calendarMember.findUnique({
    where: {
      calendarId_userId: {
        calendarId: data.calendarId,
        userId: session.user.id,
      },
    },
  });

  if (!calendarMember || calendarMember.role === "VIEWER") {
    throw new Error("You don't have permission to create events in this calendar");
  }

  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      type: data.type,
      calendarId: data.calendarId,
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

export async function getEvents(startDate: Date, endDate: Date, calendarId?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return [];
  }

  let calendarIds: string[];

  // If a specific calendar is provided, use only that
  if (calendarId) {
    calendarIds = [calendarId];
  } else {
    // Otherwise get all calendars the user is a member of
    const userCalendars = await prisma.calendarMember.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        calendarId: true,
      },
    });
    calendarIds = userCalendars.map((c) => c.calendarId);
  }

  const events = await prisma.event.findMany({
    where: {
      calendarId: { in: calendarIds },
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

export async function getCalendars() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      myCalendars: [],
      sharedCalendars: [],
      myProjects: [],
    };
  }

  // Get all calendars user is a member of
  const calendarMemberships = await prisma.calendarMember.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      calendar: {
        include: {
          members: {
            where: {
              role: "OWNER",
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      },
    },
  });

  let myCalendars = calendarMemberships
    .filter((m) => m.role === "OWNER")
    .map((m) => ({ 
      ...m.calendar, 
      role: m.role,
      owner: m.calendar.members[0]?.user,
    }));

  // If user has no calendars, create a default one
  if (myCalendars.length === 0) {
    const defaultCalendar = await getOrCreateDefaultCalendar();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true },
    });
    myCalendars = [{ 
      ...defaultCalendar, 
      role: "OWNER" as const,
      owner: user,
      members: [],
    }];
  }

  const sharedCalendars = calendarMemberships
    .filter((m) => m.role !== "OWNER")
    .map((m) => ({ 
      ...m.calendar, 
      role: m.role,
      owner: m.calendar.members[0]?.user,
    }));

  // Get all projects user is a member of
  const projectMemberships = await prisma.projectMember.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      project: true,
    },
  });

  const myProjects = projectMemberships.map((m) => ({ ...m.project, role: m.role }));

  return {
    myCalendars,
    sharedCalendars,
    myProjects,
  };
}

export async function getLastSelectedCalendar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { lastSelectedCalendarId: true },
  });

  if (user?.lastSelectedCalendarId) {
    return user.lastSelectedCalendarId;
  }

  // If no last selected calendar, get the default calendar
  const defaultCalendar = await prisma.calendar.findFirst({
    where: {
      isDefault: true,
      members: {
        some: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
  });

  return defaultCalendar?.id ?? null;
}

export async function updateLastSelectedCalendar(calendarId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastSelectedCalendarId: calendarId },
  });

  revalidatePath("/calendar");
}

export async function getUpcomingReminders() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return [];
  }

  // Get all calendars the user is a member of
  const userCalendars = await prisma.calendarMember.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      calendarId: true,
      calendar: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  const calendarIds = userCalendars.map((c) => c.calendarId);
  const calendarMap = new Map(userCalendars.map((c) => [c.calendar.id, c.calendar]));

  const now = new Date();

  // Get all REMINDER type events from user's calendars that are upcoming
  const reminders = await prisma.event.findMany({
    where: {
      calendarId: { in: calendarIds },
      type: "REMINDER",
      startDate: {
        gte: now,
      },
    },
    orderBy: {
      title: "asc",
    },
    include: {
      checklist: true,
    },
  });

  // Attach calendar info to each reminder
  return reminders.map((reminder) => ({
    ...reminder,
    calendar: calendarMap.get(reminder.calendarId) || null,
  }));
}

export async function getUpcomingRemindersCount() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return 0;
  }

  // Get all calendars the user is a member of
  const userCalendars = await prisma.calendarMember.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      calendarId: true,
    },
  });

  const calendarIds = userCalendars.map((c) => c.calendarId);
  const now = new Date();

  // Count all upcoming REMINDER and EVENT type items
  const count = await prisma.event.count({
    where: {
      calendarId: { in: calendarIds },
      type: { in: ["REMINDER", "EVENT"] },
      startDate: {
        gte: now,
      },
    },
  });

  return count;
}

export async function getUpcomingItems() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return [];
  }

  // Get all calendars the user is a member of
  const userCalendars = await prisma.calendarMember.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      calendarId: true,
      calendar: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  const calendarIds = userCalendars.map((c) => c.calendarId);
  const calendarMap = new Map(userCalendars.map((c) => [c.calendar.id, c.calendar]));

  const now = new Date();

  // Get all REMINDER and EVENT type items from user's calendars that are upcoming
  const items = await prisma.event.findMany({
    where: {
      calendarId: { in: calendarIds },
      type: { in: ["REMINDER", "EVENT"] },
      startDate: {
        gte: now,
      },
    },
    orderBy: {
      startDate: "asc",
    },
    include: {
      checklist: true,
    },
  });

  // Attach calendar info to each item
  return items.map((item) => ({
    ...item,
    calendar: calendarMap.get(item.calendarId) || null,
  }));
}
