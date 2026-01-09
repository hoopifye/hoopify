"use server";

import { prisma } from "@/lib/auth";
import { getSession } from "@/lib/auth-actions";
import { revalidatePath } from "next/cache";

export async function createCalendar(data: {
  name: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
}) {
  const session = await getSession();

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
  const session = await getSession();

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
  const session = await getSession();

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
  const session = await getSession();

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
  const session = await getSession();

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
    if (user) {
      myCalendars = [{ 
        ...defaultCalendar, 
        role: "OWNER" as const,
        owner: user,
        members: [],
      }];
    }
  }

  const sharedCalendars = calendarMemberships
    .filter((m) => m.role !== "OWNER" && m.calendar.members[0]?.user)
    .map((m) => ({ 
      ...m.calendar, 
      role: m.role,
      owner: m.calendar.members[0]!.user,
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
  const session = await getSession();

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
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastSelectedCalendarId: calendarId },
  });

  revalidatePath("/calendar");
}

export async function getEventDetails(eventId: string) {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      checklist: true,
      participants: {
        where: { userId: session.user.id },
      },
      calendar: {
        include: {
          members: {
            where: { userId: session.user.id },
          },
        },
      },
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // Check if user has access to this event (either as participant or calendar member)
  const hasAccess = event.participants.length > 0 || event.calendar.members.length > 0;
  
  if (!hasAccess) {
    throw new Error("You don't have permission to view this event");
  }

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    type: event.type,
    completed: event.completed,
    checklist: event.checklist,
  };
}

export async function dismissReminder(eventId: string) {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      participants: {
        where: { userId: session.user.id },
      },
      calendar: {
        include: {
          members: {
            where: { userId: session.user.id },
          },
        },
      },
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // Check if it's a reminder
  if (event.type !== "REMINDER") {
    throw new Error("Only reminders can be dismissed");
  }

  // Check if user has permission (participant owner or calendar editor/owner)
  const isParticipantOwner = event.participants.some((p) => p.role === "OWNER");
  const isCalendarEditorOrOwner = event.calendar.members.some(
    (m) => m.role === "OWNER" || m.role === "EDITOR"
  );

  if (!isParticipantOwner && !isCalendarEditorOrOwner) {
    throw new Error("You don't have permission to dismiss this reminder");
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { completed: true },
  });

  revalidatePath("/calendar");
}

export async function toggleChecklistItem(checklistItemId: string, completed: boolean) {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const checklistItem = await prisma.checklistItem.findUnique({
    where: { id: checklistItemId },
    include: {
      event: {
        include: {
          participants: {
            where: { userId: session.user.id },
          },
          calendar: {
            include: {
              members: {
                where: { userId: session.user.id },
              },
            },
          },
        },
      },
    },
  });

  if (!checklistItem) {
    throw new Error("Checklist item not found");
  }

  // Check if user has access (participant or calendar member with editor/owner role)
  const hasAccess = 
    checklistItem.event.participants.length > 0 || 
    checklistItem.event.calendar.members.some(
      (m) => m.role === "OWNER" || m.role === "EDITOR"
    );

  if (!hasAccess) {
    throw new Error("You don't have permission to modify this checklist item");
  }

  await prisma.checklistItem.update({
    where: { id: checklistItemId },
    data: { completed },
  });

  // Check if all checklist items are completed and update event accordingly
  const allChecklistItems = await prisma.checklistItem.findMany({
    where: { eventId: checklistItem.eventId },
  });

  const allCompleted = allChecklistItems.length > 0 && allChecklistItems.every(item => item.completed);
  
  // Update event completed status based on checklist completion
  await prisma.event.update({
    where: { id: checklistItem.eventId },
    data: { completed: allCompleted },
  });

  revalidatePath("/calendar");
}

export async function getUpcomingRemindersCount() {
  const session = await getSession();

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

  // Count upcoming events (starting in less than 3 days from 1 hour ago)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  
  const count = await prisma.event.count({
    where: {
      calendarId: { in: calendarIds },
      completed: false,
      startDate: {
        gte: oneHourAgo,
        lte: threeDaysFromNow,
      },
    },
  });

  return count;
}

export async function getUpcomingItems() {
  const session = await getSession();

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
    },
  });

  const calendarIds = userCalendars.map((c) => c.calendarId);

  // Get items from 1 hour ago onwards (late items will be marked as such in the UI)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Get upcoming incomplete events and reminders
  const items = await prisma.event.findMany({
    where: {
      calendarId: { in: calendarIds },
      completed: false,
      startDate: {
        gte: oneHourAgo,
      },
    },
    include: {
      calendar: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: {
      startDate: "asc",
    },
  });

  return items;
}
