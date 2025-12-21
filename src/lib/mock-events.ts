
export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
}

export function generateMockEvents(year: number, month: number): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    // Randomly decide if this day has events (30% chance)
    if (Math.random() < 0.3) {
      // Random number of events (1 to 5)
      const numEvents = Math.floor(Math.random() * 5) + 1;
      
      for (let i = 0; i < numEvents; i++) {
        events.push({
          id: `${year}-${month}-${day}-${i}`,
          title: `Event ${i + 1} on ${day}/${month + 1}`,
          date: new Date(year, month, day),
        });
      }
    }
  }
  
  return events;
}

export function getEventCountForDate(events: CalendarEvent[], date: Date): number {
  return events.filter(
    (event) =>
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
  ).length;
}
