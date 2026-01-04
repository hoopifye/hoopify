"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEvent, getOrCreateDefaultCalendar } from "@/lib/calendar-actions";
import { Plus, X } from "lucide-react";

export function AddEventDialog({
  children,
  selectedDate,
  onEventCreated,
  calendarId,
}: {
  children: React.ReactNode;
  selectedDate?: Date;
  onEventCreated?: () => void;
  calendarId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"REMINDER" | "EVENT">("EVENT");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [checklist, setChecklist] = useState<string[]>([""]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setStartTime("");
      setEndTime("");
      setTitle("");
      setChecklist([""]);
      setType("EVENT");
      setError("");
    }
  }, [open]);

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setStartTime(newStart);
    setError("");
    if (endTime && newStart > endTime) {
      setEndTime(newStart);
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value;
    setError("");
    if (startTime && newEnd < startTime) {
      setError("End time cannot be before start time");
      return;
    }
    setEndTime(newEnd);
  };

  const handleChecklistChange = (index: number, value: string) => {
    const newChecklist = [...checklist];
    newChecklist[index] = value;
    setChecklist(newChecklist);
  };

  const addChecklistItem = () => {
    setChecklist([...checklist, ""]);
  };

  const removeChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    setLoading(true);

    try {
      const [startHours, startMinutes] = (startTime || "00:00").split(":").map(Number);
      const start = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        startHours,
        startMinutes
      );

      let end: Date;
      if (type === "REMINDER") {
        end = start;
      } else {
        const [endHours, endMinutes] = (endTime || "23:59").split(":").map(Number);
        end = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          endHours,
          endMinutes
        );

        if (end <= start) {
          setError("End time must be after start time");
          setLoading(false);
          return;
        }
      }

      // Get or create default calendar if no calendarId provided
      let targetCalendarId = calendarId;
      if (!targetCalendarId) {
        const defaultCalendar = await getOrCreateDefaultCalendar();
        targetCalendarId = defaultCalendar.id;
      }

      await createEvent({
        title,
        startDate: start,
        endDate: end,
        type,
        calendarId: targetCalendarId,
        checklist: type === "EVENT" ? checklist.filter(item => item.trim() !== "") : undefined,
      });

      setOpen(false);
      onEventCreated?.();
    } catch (error) {
      console.error("Failed to create event:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add {type === "REMINDER" ? "Reminder" : "Event"}</DialogTitle>
          <DialogDescription>
            Add a new item to your calendar for {selectedDate?.toLocaleDateString()}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                value={selectedDate ? selectedDate.toLocaleDateString() : ""}
                disabled
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                value={type}
                onValueChange={(value: "REMINDER" | "EVENT") => setType(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REMINDER">Reminder</SelectItem>
                  <SelectItem value="EVENT">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-start-2 col-span-3 h-5">
                <p className="text-sm text-red-500 font-medium">{error}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <div className="col-span-3 flex gap-2 items-center">
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={handleStartTimeChange}
                  required
                  className="flex-1"
                  min="00:00"
                  max="23:59"
                />
                {type === "EVENT" && (
                  <>
                    <span>-</span>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={handleEndTimeChange}
                      required
                      className="flex-1"
                      min={startTime}
                      max="23:59"
                    />
                  </>
                )}
              </div>
            </div>

            {type === "EVENT" && (
              <div className="grid grid-cols-4 gap-4 items-start">
                <Label className="text-right pt-3">Checklist</Label>
                <div className="col-span-3 h-64 flex flex-col">
                  <div className="overflow-y-auto min-h-0 space-y-2 pr-2">
                    {checklist.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => handleChecklistChange(index, e.target.value)}
                          placeholder={`Item ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 shrink-0"
                          onClick={() => removeChecklistItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addChecklistItem} className="w-full mt-2 shrink-0">
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                  <div className="flex-1" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
