"use client";

import { useState, useMemo } from "react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMockEvents, getEventCountForDate, CalendarEvent } from "@/lib/mock-events";
import { DayButtonProps } from "react-day-picker";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const events = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    let allEvents: CalendarEvent[] = [];
    // Generate events for current year and next year
    for (let y = year; y <= year + 1; y++) {
      for (let m = 0; m < 12; m++) {
        allEvents = [...allEvents, ...generateMockEvents(y, m)];
      }
    }
    return allEvents;
  }, []);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(
      (event) =>
        event.date.getDate() === selectedDate.getDate() &&
        event.date.getMonth() === selectedDate.getMonth() &&
        event.date.getFullYear() === selectedDate.getFullYear()
    );
  }, [selectedDate, events]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Calendar</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>
                Select a date to view or manage your events
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                captionLayout="dropdown"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border [--cell-size:60px] p-6 [&_button]:text-lg [&_th]:text-lg"
                components={{
                  DayButton: (props: DayButtonProps) => {
                    const { day } = props;
                    const { date } = day;
                    const count = getEventCountForDate(events, date);
                    return (
                      <div className="relative w-full h-full">
                        <CalendarDayButton {...props} />
                        {count > 0 && (
                          <div className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white pointer-events-none z-20">
                            {count}
                          </div>
                        )}
                      </div>
                    );
                  }
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selected Date</CardTitle>
              <CardDescription>
                {selectedDate ? selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) : "No date selected"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Events for this day</h3>
                  {selectedDateEvents.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedDateEvents.map((event) => (
                        <li key={event.id} className="text-sm p-2 bg-muted rounded-md">
                          {event.title}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No events scheduled for this date.
                    </p>
                  )}
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Future features: Add events, reminders, and schedule management.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
