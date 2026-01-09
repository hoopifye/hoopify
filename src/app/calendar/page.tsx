"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { DayButtonProps } from "react-day-picker";
import { getEvents, getCalendars, getLastSelectedCalendar, updateLastSelectedCalendar, createCalendar } from "@/lib/calendar-actions";
import { AddEventDialog } from "@/components/add-event-dialog";
import { EventDetailDialog } from "@/components/event-detail-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Check, ChevronsUpDown, Settings, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  completed: boolean;
  calendarId?: string;
};

type CalendarType = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  isDefault: boolean;
  role?: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
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

function CalendarPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const urlParamsProcessed = useRef(false);
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
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; name: string; email: string; image: string | null }>
  >([]);
  const [selectedMembers, setSelectedMembers] = useState<
    Array<{ email: string; role: string; name?: string | null; image?: string | null }>
  >([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventDetailDialogOpen, setEventDetailDialogOpen] = useState(false);

  const selectedCalendarData = useMemo(() => {
    return [...calendars.myCalendars, ...calendars.sharedCalendars, ...calendars.myProjects].find(
      (cal) => cal.id === selectedCalendar
    );
  }, [selectedCalendar, calendars]);

  const canManageCalendar = useMemo(() => {
    return selectedCalendarData?.role === "OWNER" || selectedCalendarData?.role === "ADMIN";
  }, [selectedCalendarData]);

  const truncateEmail = (email: string) => {
    const atIndex = email.indexOf('@');
    if (atIndex === -1) return email;
    const domain = email.slice(atIndex);
    const local = email.slice(0, atIndex);
    if (local.length <= 12) return email;
    return `${local.slice(0, 8)}...${domain}`;
  };

  const handleSearchUsers = async (email: string) => {
    setMemberEmail(email);
    if (email.length > 2) {
      const results = await searchUsersByEmailAction(email);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddMember = (user: { id: string; name: string; email: string; image: string | null }) => {
    if (!selectedMembers.find(m => m.email === user.email)) {
      setSelectedMembers([
        ...selectedMembers,
        { email: user.email, role: memberRole, name: user.name, image: user.image },
      ]);
      setMemberEmail("");
      setSearchResults([]);
    }
  };

  const handleRemoveMember = (email: string) => {
    setSelectedMembers(selectedMembers.filter(m => m.email !== email));
  };

  const resetCreateCalendarState = () => {
    setNewCalendarName("");
    setMemberEmail("");
    setMemberRole("VIEWER");
    setSearchResults([]);
    setSelectedMembers([]);
    setIsCreating(false);
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
      resetCreateCalendarState();
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
      
      // Check for URL parameters first (only on initial load)
      const calendarIdParam = searchParams.get('calendar_id');
      const eventIdParam = searchParams.get('event_id');
      const dateParam = searchParams.get('date');
      
      if (!urlParamsProcessed.current && calendarIdParam) {
        urlParamsProcessed.current = true;
        setSelectedCalendar(calendarIdParam);
        await updateLastSelectedCalendar(calendarIdParam);
        
        // Set the date if provided
        if (dateParam) {
          const eventDate = new Date(dateParam);
          if (!isNaN(eventDate.getTime())) {
            setSelectedDate(eventDate);
            setCurrentMonth(eventDate);
          }
        }
        
        // Open event detail dialog if event_id is provided
        if (eventIdParam) {
          setSelectedEventId(eventIdParam);
          setEventDetailDialogOpen(true);
        }
        
        // Clear URL params after a short delay to avoid interrupting the fetch
        setTimeout(() => {
          window.history.replaceState({}, '', '/calendar');
        }, 100);
      } else if (!urlParamsProcessed.current) {
        urlParamsProcessed.current = true;
        // Load last selected calendar only if no URL params
        const lastSelected = await getLastSelectedCalendar();
        if (lastSelected) {
          setSelectedCalendar(lastSelected);
        }
      }
    };
    fetchCalendars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setEventDetailDialogOpen(true);
  };

  const handleEventDetailDialogClose = (open: boolean) => {
    setEventDetailDialogOpen(open);
    if (!open) {
      setSelectedEventId(null);
    }
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
            <PopoverContent className="w-[250px] p-0" align="start">
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
                          value={`${calendar.name} ${calendar.owner?.name || ""} ${calendar.owner?.email || ""}`}
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
                              "mr-2 h-4 w-4 shrink-0",
                              selectedCalendar === calendar.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {calendar.owner && (
                            <Avatar className="h-6 w-6 mr-2 shrink-0">
                              <AvatarImage src={calendar.owner.image || undefined} alt={calendar.owner.name} />
                              <AvatarFallback className="text-xs">
                                {calendar.owner.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex flex-col">
                            <span>{calendar.name}</span>
                            {calendar.owner && (
                              <span className="text-xs text-muted-foreground">
                                {calendar.owner.name}
                              </span>
                            )}
                          </div>
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
                      <li 
                        key={event.id} 
                        className={cn(
                          "text-sm p-2 bg-muted rounded-md w-full flex justify-between items-center cursor-pointer hover:bg-muted/80 transition-colors",
                          event.completed && "opacity-60 line-through"
                        )}
                        onClick={() => handleEventClick(event.id)}
                      >
                        <span className="font-medium">{event.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {event.completed && event.type === "REMINDER" ? "Completed" : getTimeToEvent(event.startDate) === "started"
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

      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            resetCreateCalendarState();
          }
        }}
      >
        {/* Fixed position from top (top-[10%]) and removed vertical centering (translate-y-0) to prevent shift.
            Fixed height container for members list prevents resizing. */}
        <DialogContent className="sm:max-w-[500px] top-[10%] translate-y-0 flex flex-col gap-0 p-0 overflow-hidden" showCloseButton={false}>
            <div className="p-6 pb-2">
            <DialogHeader>
                <DialogTitle>Create New Calendar</DialogTitle>
                <DialogDescription>
                Create a new calendar and optionally invite members.
                </DialogDescription>
            </DialogHeader>
            </div>

            <div className="p-6 py-4 space-y-4 overflow-y-auto no-scrollbar max-h-[calc(80vh-10rem)]">
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
                
                {/* Preallocated space for members (h-48 approx 5-6 items) */}
                <div className="space-y-2 mt-3 h-48 overflow-y-auto pr-2 border rounded-md p-2 bg-muted/20">
                    {selectedMembers.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                            No members invited yet
                        </div>
                    ) : (
                        selectedMembers.map((member) => (
                        <div
                            key={member.email}
                            className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                        >
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="flex-1 min-w-0 flex items-center mr-2 text-left focus:outline-none"
                                >
                                  <span className="font-medium truncate" title={member.email}>
                                    {truncateEmail(member.email)}
                                  </span>
                                  <span className="ml-2 text-xs text-muted-foreground shrink-0">
                                    ({member.role})
                                  </span>
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-3" align="start">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={member.image || undefined}
                                      alt={member.name || member.email}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {(member.name || member.email)
                                        .charAt(0)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="text-sm">
                                    <div className="font-medium">
                                      {member.name || member.email}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {member.email}
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.email)}
                              className="h-6 w-6 p-0 shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                        </div>
                        ))
                    )}
                </div>
                </div>
            </div>

            <div className="p-6 pt-2">
            <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetCreateCalendarState();
                    setCreateDialogOpen(false);
                  }}
                  disabled={isCreating}
                >
                Cancel
                </Button>
                <Button onClick={handleCreateCalendar} disabled={!newCalendarName.trim() || isCreating}>
                {isCreating ? "Creating..." : "Create Calendar"}
                </Button>
            </DialogFooter>
            </div>
        </DialogContent>
      </Dialog>

      <EventDetailDialog
        eventId={selectedEventId}
        open={eventDetailDialogOpen}
        onOpenChange={handleEventDetailDialogClose}
        onEventUpdated={() => setRefreshTrigger(prev => prev + 1)}
      />
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <CalendarPageContent />
    </Suspense>
  );
}
