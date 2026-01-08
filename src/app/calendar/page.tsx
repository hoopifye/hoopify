"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { DayButtonProps } from "react-day-picker";
import { getEvents, getCalendars, getLastSelectedCalendar, updateLastSelectedCalendar, createCalendar } from "@/lib/calendar-actions";
import { AddEventDialog } from "@/components/add-event-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Check, ChevronsUpDown, Settings, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchUsersByEmailAction, addCalendarMemberAction } from "@/lib/settings-actions";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Event = {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: "REMINDER" | "EVENT";
  calendarId?: string;
};

type CalendarType = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  isDefault: boolean;
  role?: string;
};

type ProjectType = {
  id: string;
  name: string;
  description: string | null;
  role?: string;
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
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [calendars, setCalendars] = useState<{
    myCalendars: CalendarType[];
    sharedCalendars: CalendarType[];
    myProjects: ProjectType[];
  }>({ myCalendars: [], sharedCalendars: [], myProjects: [] });
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("VIEWER");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedMembers, setSelectedMembers] = useState<Array<{ email: string; role: string }>>([]);
  const [isCreating, setIsCreating] = useState(false);

  const selectedCalendarData = useMemo(() => {
    return [...calendars.myCalendars, ...calendars.sharedCalendars, ...calendars.myProjects].find(
      (cal) => cal.id === selectedCalendar
    );
  }, [selectedCalendar, calendars]);

  const canManageCalendar = useMemo(() => {
    return selectedCalendarData?.role === "OWNER" || selectedCalendarData?.role === "ADMIN";
  }, [selectedCalendarData]);

  const handleSearchUsers = async (email: string) => {
    setMemberEmail(email);
    if (email.length > 2) {
      const results = await searchUsersByEmailAction(email);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddMember = (user: { id: string; name: string; email: string }) => {
    if (!selectedMembers.find(m => m.email === user.email)) {
      setSelectedMembers([...selectedMembers, { email: user.email, role: memberRole }]);
      setMemberEmail("");
      setSearchResults([]);
    }
  };

  const handleRemoveMember = (email: string) => {
    setSelectedMembers(selectedMembers.filter(m => m.email !== email));
  };

  const handleCreateCalendar = async () => {
    if (!newCalendarName.trim()) return;
    
    setIsCreating(true);
    try {
      const calendar = await createCalendar({ name: newCalendarName.trim() });
      
      // Add members if any
      for (const member of selectedMembers) {
        const formData = new FormData();
        formData.append("calendarId", calendar.id);
        formData.append("userEmail", member.email);
        formData.append("role", member.role);
        await addCalendarMemberAction(formData);
      }
      
      // Reset form
      setNewCalendarName("");
      setSelectedMembers([]);
      setCreateDialogOpen(false);
      
      // Refresh calendars and select the new one
      const data = await getCalendars();
      setCalendars(data as {
        myCalendars: CalendarType[];
        sharedCalendars: CalendarType[];
        myProjects: ProjectType[];
      });
      setSelectedCalendar(calendar.id);
      await updateLastSelectedCalendar(calendar.id);
    } catch (error) {
      console.error("Failed to create calendar:", error);
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    const fetchCalendars = async () => {
      const data = await getCalendars();
      setCalendars(data as {
        myCalendars: CalendarType[];
        sharedCalendars: CalendarType[];
        myProjects: ProjectType[];
      });
      
      // Load last selected calendar
      const lastSelected = await getLastSelectedCalendar();
      if (lastSelected) {
        setSelectedCalendar(lastSelected);
      }
    };
    fetchCalendars();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0);
      
      try {
        const fetchedEvents = await getEvents(start, end, selectedCalendar || undefined);
        setEvents(fetchedEvents as Event[]);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };
    fetchEvents();
  }, [currentMonth, refreshTrigger, selectedCalendar]);

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
      <div className="flex-1 flex flex-col lg:block max-w-8xl mx-auto w-full min-h-0">
        <div className="flex items-center gap-2 py-4 px-4 lg:mb-6 lg:px-0 lg:py-0">
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className="min-w-0 flex-1 sm:w-[250px] sm:flex-initial justify-between"
              >
                {selectedCalendar
                  ? [...calendars.myCalendars, ...calendars.sharedCalendars, ...calendars.myProjects].find((calendar) => calendar.id === selectedCalendar)?.name
                  : "Select calendar..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
              <Command>
                <CommandInput placeholder="Search calendar..." />
                <CommandList>
                  <CommandEmpty>No calendar found.</CommandEmpty>
                  {calendars.myCalendars.length > 0 && (
                    <CommandGroup heading="Your Calendars">
                      {calendars.myCalendars.map((calendar) => (
                        <CommandItem
                          key={calendar.id}
                          value={calendar.name}
                        onSelect={async () => {
                          const newId = calendar.id === selectedCalendar ? "" : calendar.id;
                          setSelectedCalendar(newId);
                          if (newId) {
                            await updateLastSelectedCalendar(newId);
                          }
                          setOpenCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCalendar === calendar.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {calendar.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {calendars.myCalendars.length > 0 && calendars.sharedCalendars.length > 0 && (
                    <CommandSeparator />
                  )}
                  {calendars.sharedCalendars.length > 0 && (
                    <CommandGroup heading="Shared with You">
                      {calendars.sharedCalendars.map((calendar) => (
                        <CommandItem
                          key={calendar.id}
                          value={calendar.name}
                        onSelect={async () => {
                          const newId = calendar.id === selectedCalendar ? "" : calendar.id;
                          setSelectedCalendar(newId);
                          if (newId) {
                            await updateLastSelectedCalendar(newId);
                          }
                          setOpenCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCalendar === calendar.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {calendar.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {(calendars.myCalendars.length > 0 || calendars.sharedCalendars.length > 0) && calendars.myProjects.length > 0 && (
                    <CommandSeparator />
                  )}
                  {calendars.myProjects.length > 0 && (
                    <CommandGroup heading="My Projects">
                      {calendars.myProjects.map((project) => (
                        <CommandItem
                          key={project.id}
                          value={project.name}
                        onSelect={async () => {
                          const newId = project.id === selectedCalendar ? "" : project.id;
                          setSelectedCalendar(newId);
                          if (newId) {
                            await updateLastSelectedCalendar(newId);
                          }
                          setOpenCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCalendar === project.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {project.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setCreateDialogOpen(true);
                        setOpenCombobox(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Calendar
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {canManageCalendar && selectedCalendar && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(`/settings?calendar_id=${selectedCalendar}`)}
              className="shrink-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
        
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
                className="rounded-md border-0 lg:border p-0 lg:p-3 [&_button]:text-lg [&_th]:text-lg w-full [&_table_button]:w-full [&_table_button]:h-full [&_table_button]:aspect-square"
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

          <div className="flex-1 flex flex-col min-h-0 w-full lg:col-span-7 px-4 lg:px-0 lg:rounded-xl lg:border lg:bg-card lg:text-card-foreground lg:shadow-sm lg:mt-0">
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
              
            <div className="shrink-0 p-4 lg:pt-4 lg:mt-4 lg:border-t">
              <AddEventDialog 
                selectedDate={selectedDate}
                onEventCreated={() => setRefreshTrigger(prev => prev + 1)}
                calendarId={selectedCalendar}
              >
                <Button className="w-full" disabled={!selectedDate}>
                  <Plus className="mr-2 h-4 w-4" /> Add Event
                </Button>
              </AddEventDialog>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Calendar</DialogTitle>
            <DialogDescription>
              Create a new calendar and optionally invite members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="calendar-name">Calendar Name</Label>
              <Input
                id="calendar-name"
                placeholder="My Calendar"
                value={newCalendarName}
                onChange={(e) => setNewCalendarName(e.target.value)}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Invite Members (Optional)</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Search by email..."
                    value={memberEmail}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-40 overflow-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                          onClick={() => handleAddMember(user)}
                        >
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Select value={memberRole} onValueChange={setMemberRole}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                    <SelectItem value="EDITOR">Editor</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedMembers.length > 0 && (
                <div className="space-y-2 mt-3">
                  {selectedMembers.map((member) => (
                    <div
                      key={member.email}
                      className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{member.email}</span>
                        <span className="ml-2 text-xs text-muted-foreground">({member.role})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.email)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreateCalendar} disabled={!newCalendarName.trim() || isCreating}>
              {isCreating ? "Creating..." : "Create Calendar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
