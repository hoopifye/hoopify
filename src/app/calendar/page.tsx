"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { DayButtonProps } from "react-day-picker";
import { getEvents } from "@/lib/calendar-actions";
import { AddEventDialog } from "@/components/add-event-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type Event = {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: "REMINDER" | "EVENT" | "PROJECT";
};

function getTimeToEvent(date: Date) {
  const now = new Date();
  const diff = new Date(date).getTime() - now.getTime();
  
  if (diff < 0) return "started";

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  return "now";
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchEvents = async () => {
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0);
      
      try {
        const fetchedEvents = await getEvents(start, end);
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };
    fetchEvents();
  }, [currentMonth, refreshTrigger]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(
      (event) =>
        new Date(event.startDate).getDate() === selectedDate.getDate() &&
        new Date(event.startDate).getMonth() === selectedDate.getMonth() &&
        new Date(event.startDate).getFullYear() === selectedDate.getFullYear()
    );
  }, [selectedDate, events]);

  const getEventCountForDate = (date: Date) => {
    return events.filter(
      (event) =>
        new Date(event.startDate).getDate() === date.getDate() &&
        new Date(event.startDate).getMonth() === date.getMonth() &&
        new Date(event.startDate).getFullYear() === date.getFullYear()
    ).length;
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] lg:h-auto lg:block lg:container lg:mx-auto lg:py-8 lg:px-4">
      <div className="flex-1 flex flex-col lg:block max-w-7xl mx-auto w-full min-h-0">
        <h1 className="shrink-0 text-3xl font-bold py-4 px-4 lg:mb-6 lg:px-0 lg:py-0">My Calendar</h1>
        
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 min-h-0">
          <div className="shrink-0 w-full lg:col-span-5 lg:rounded-xl lg:border lg:bg-card lg:text-card-foreground lg:shadow-sm">
            <div className="hidden lg:flex flex-col space-y-1.5 p-6">
              <h3 className="font-semibold leading-none tracking-tight">Calendar</h3>
              <p className="text-sm text-muted-foreground">
                Select a date to view or manage your events
              </p>
            </div>
            <div className="w-full lg:p-6">
              <Calendar
                mode="single"
                captionLayout="dropdown"
                selected={selectedDate}
                onSelect={setSelectedDate}
                onMonthChange={setCurrentMonth}
                className="rounded-md border-0 lg:border lg:[--cell-size:65px] p-0 lg:p-6 [&_button]:text-lg [&_th]:text-lg w-full [&_table_button]:w-full [&_table_button]:h-full [&_table_button]:aspect-square"
                classNames={{
                  root: "w-full",
                  months: "flex w-full flex-col relative",
                  month: "flex flex-col w-full gap-4",
                  table: "w-full",
                  head_row: "w-full flex",
                  head_cell: "flex-1 w-full",
                  row: "w-full flex",
                  cell: "flex-1 w-full aspect-square p-0 relative focus-within:relative focus-within:z-20",
                  day: "w-full h-full aspect-square p-0",
                }}
                components={{
                  DayButton: (props: DayButtonProps) => {
                    const { day } = props;
                    const { date } = day;
                    const count = getEventCountForDate(date);
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
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 w-full lg:col-span-6 lg:h-[500px] px-4 lg:px-0 lg:rounded-xl lg:border lg:bg-card lg:text-card-foreground lg:shadow-sm lg:mt-0">
            <div className="shrink-0 pt-4 pb-2 lg:p-6 lg:pb-4">
              <h3 className="font-semibold leading-none tracking-tight">
                {selectedDate ? "Events for " + selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) : "No date selected"}
              </h3>
            </div>
            <Separator className="my-2 mx-0 w-full lg:my-4"/>
            <div className="flex-1 overflow-y-auto min-h-0 lg:p-6 lg:pt-0">
              <div className="pr-2">
                {selectedDateEvents.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedDateEvents.map((event) => (
                      <li key={event.id} className="text-sm p-2 bg-muted rounded-md w-full flex justify-between items-center">
                        <span className="font-medium">{event.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {getTimeToEvent(event.startDate) === "started"
                            ? "started"
                            : `${event.type.charAt(0) + event.type.slice(1).toLowerCase()} ${getTimeToEvent(event.startDate)}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No events scheduled for this date.
                  </p>
                )}
              </div>
            </div>
              
            <div className="shrink-0 py-4 lg:pt-4 lg:mt-4 lg:border-t">
              <AddEventDialog 
                selectedDate={selectedDate}
                onEventCreated={() => setRefreshTrigger(prev => prev + 1)}
              >
                <Button className="w-full" disabled={!selectedDate}>
                  <Plus className="mr-2 h-4 w-4" /> Add Event
                </Button>
              </AddEventDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
