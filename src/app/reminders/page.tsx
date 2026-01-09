"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Bell, Calendar, ExternalLink } from "lucide-react";
import { getUpcomingItems } from "@/lib/calendar-actions";
import { useRouter } from "next/navigation";

type UpcomingItem = {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  type: "REMINDER" | "EVENT";
  calendarId: string;
  calendar: {
    id: string;
    name: string;
    color: string;
  } | null;
};

export default function UpcomingPage() {
  const router = useRouter();
  const [items, setItems] = useState<UpcomingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const handleViewItem = (item: UpcomingItem) => {
    const params = new URLSearchParams();
    if (item.calendarId) {
      params.set('calendar_id', item.calendarId);
    }
    params.set('event_id', item.id);
    params.set('date', new Date(item.startDate).toISOString());
    router.push(`/calendar?${params.toString()}`);
  };

  const isLate = (startDate: Date) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    return new Date(startDate) < oneHourAgo;
  };

  useEffect(() => {
    async function fetchItems() {
      setIsLoading(true);
      try {
        const data = await getUpcomingItems();
        // Already sorted by date from server
        setItems(data);
      } catch (error) {
        console.error("Failed to fetch upcoming items:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchItems();
  }, []);

  // Filter items based on search query (by content and calendar name)
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(query);
      const descriptionMatch = item.description?.toLowerCase().includes(query);
      const calendarMatch = item.calendar?.name.toLowerCase().includes(query);
      return titleMatch || descriptionMatch || calendarMatch;
    });
  }, [items, searchQuery]);

  const handleDismiss = (id: string) => {
    setItems((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Upcoming</h1>
          <p className="text-muted-foreground mt-2">Manage your upcoming reminders and events</p>
        </div>

        {/* Search Box */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by content or calendar name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <Card className="p-3">
              <p className="text-center text-sm text-muted-foreground">Loading upcoming items...</p>
            </Card>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <Card key={item.id} className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {item.type === "REMINDER" ? (
                      <Bell className="h-7 w-7 text-amber-500 shrink-0" />
                    ) : (
                      <Calendar className="h-7 w-7 text-blue-500 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                      )}
                      {item.calendar && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.calendar.color }}
                          />
                          <span className="text-xs text-muted-foreground truncate">{item.calendar.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {isLate(item.startDate) && (
                      <span className="text-xs font-medium text-red-500 whitespace-nowrap">Late</span>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleViewItem(item)} className="h-7 px-2">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      <span className="text-xs">View</span>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDismiss(item.id)} className="h-7 px-2">
                      <span className="text-xs">Dismiss</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-3">
              <p className="text-center text-sm text-muted-foreground">
                {searchQuery ? "No items match your search" : "No upcoming items"}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
