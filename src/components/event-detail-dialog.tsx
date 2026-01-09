"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { getEventDetails, dismissReminder, toggleChecklistItem } from "@/lib/calendar-actions";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type EventDetails = {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  type: "REMINDER" | "EVENT";
  completed: boolean;
  checklist: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
};

interface EventDetailDialogProps {
  eventId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdated?: () => void;
}

export function EventDetailDialog({
  eventId,
  open,
  onOpenChange,
  onEventUpdated,
}: EventDetailDialogProps) {
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEventDetails = async () => {
    if (!eventId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const details = await getEventDetails(eventId);
      setEvent(details as EventDetails);
    } catch (err) {
      console.error("Failed to load event details:", err);
      setError(err instanceof Error ? err.message : "Failed to load event details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && eventId) {
      // Reset state when opening with a new event
      setEvent(null);
      setError(null);
      setIsLoading(true);
      loadEventDetails();
    } else if (!open) {
      // Reset state when closing
      setEvent(null);
      setError(null);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, eventId]);

  const handleDismissReminder = async () => {
    if (!event) return;
    
    setIsDismissing(true);
    try {
      await dismissReminder(event.id);
      onOpenChange(false);
      onEventUpdated?.();
    } catch (error) {
      console.error("Failed to dismiss reminder:", error);
    } finally {
      setIsDismissing(false);
    }
  };

  const handleToggleChecklistItem = async (checklistItemId: string, currentCompleted: boolean) => {
    if (!event) return;
    
    // Update local state optimistically
    const updatedChecklist = event.checklist.map((item) =>
      item.id === checklistItemId
        ? { ...item, completed: !currentCompleted }
        : item
    );
    
    // Check if all items are now completed
    const allCompleted = updatedChecklist.length > 0 && updatedChecklist.every(item => item.completed);
    
    setEvent({
      ...event,
      checklist: updatedChecklist,
      completed: allCompleted,
    });
    
    try {
      await toggleChecklistItem(checklistItemId, !currentCompleted);
      onEventUpdated?.();
    } catch (error) {
      console.error("Failed to toggle checklist item:", error);
      // Reload on error
      loadEventDetails();
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? "Loading..." : error ? "Error" : event ? event.title : "Event Not Found"}
          </DialogTitle>
          {event && (
            <DialogDescription>
              {event.type === "REMINDER" ? "Reminder" : "Event"} details{event.completed && event.type === "REMINDER" ? " (Completed)" : ""}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : event ? (
          <>
            <div className="space-y-4 py-4">
              {/* Time Information */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Start:</span>
                  <span className="font-medium">{formatDate(event.startDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">End:</span>
                  <span className="font-medium">{formatDate(event.endDate)}</span>
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                </>
              )}

              {/* Checklist for Events */}
              {event.type === "EVENT" && event.checklist.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Checklist</h4>
                    <div className="space-y-2">
                      {event.checklist.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition-colors"
                        >
                          <Checkbox
                            id={item.id}
                            checked={item.completed}
                            onCheckedChange={() =>
                              handleToggleChecklistItem(item.id, item.completed)
                            }
                          />
                          <label
                            htmlFor={item.id}
                            className={`flex-1 text-sm cursor-pointer ${
                              item.completed
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {item.text}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* No checklist message for Events */}
              {event.type === "EVENT" && event.checklist.length === 0 && (
                <>
                  <Separator />
                  <p className="text-sm text-muted-foreground">
                    No checklist items for this event.
                  </p>
                </>
              )}
            </div>

            <DialogFooter>
              {event.type === "REMINDER" ? (
                <>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                  {!event.completed && (
                    <Button
                      onClick={handleDismissReminder}
                      disabled={isDismissing}
                    >
                      {isDismissing ? "Marking Complete..." : "Mark as Complete"}
                    </Button>
                  )}
                </>
              ) : (
                <Button onClick={() => onOpenChange(false)}>Close</Button>
              )}
            </DialogFooter>
          </>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Event not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
