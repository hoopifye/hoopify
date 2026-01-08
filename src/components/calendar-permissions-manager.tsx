"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
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
import { changeCalendarMemberRoleAction, leaveCalendarAction, deleteCalendarAction, searchUsersByEmailAction, addCalendarMemberAction } from "@/lib/settings-actions";

type CalendarMember = {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type Calendar = {
  id: string;
  name: string;
  description: string | null;
  members: CalendarMember[];
};

type CalendarPermissionsManagerProps = {
  calendars: Calendar[];
  currentUserId: string;
  preselectedCalendarId?: string;
};

export function CalendarPermissionsManager({
  calendars,
  currentUserId,
  preselectedCalendarId,
}: CalendarPermissionsManagerProps) {
  const initialCalendar = preselectedCalendarId && calendars.find(c => c.id === preselectedCalendarId)
    ? preselectedCalendarId
    : (calendars.length > 0 ? calendars[0].id : "");
    
  const [selectedCalendar, setSelectedCalendar] = useState<string>(initialCalendar);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [transferOwnershipDialog, setTransferOwnershipDialog] = useState<{
    open: boolean;
    calendarId: string;
    calendarName: string;
    targetUserId: string;
    targetUserName: string;
  } | null>(null);
  const [leaveDialog, setLeaveDialog] = useState<{
    open: boolean;
    calendarId: string;
    calendarName: string;
  } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    calendarId: string;
    calendarName: string;
  } | null>(null);
  const [inviteDialog, setInviteDialog] = useState<{
    open: boolean;
    calendarId: string;
    calendarName: string;
  } | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("VIEWER");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedMembers, setSelectedMembers] = useState<Array<{ email: string; role: string; name: string }>>([]);
  const [isInviting, setIsInviting] = useState(false);

  const selectedCalendarData = calendars.find((c) => c.id === selectedCalendar);

  const handleRoleChange = async (
    calendarId: string,
    targetUserId: string,
    newRole: string,
    currentRole: string,
    calendarName: string,
    targetUserName: string
  ) => {
    // If trying to transfer ownership, show confirmation dialog
    if (newRole === "OWNER" && currentRole !== "OWNER") {
      setTransferOwnershipDialog({
        open: true,
        calendarId,
        calendarName,
        targetUserId,
        targetUserName,
      });
      return;
    }

    // Otherwise, proceed with the role change
    const formData = new FormData();
    formData.append("calendarId", calendarId);
    formData.append("targetUserId", targetUserId);
    formData.append("role", newRole);
    await changeCalendarMemberRoleAction(formData);
  };

  const confirmOwnershipTransfer = async () => {
    if (!transferOwnershipDialog) return;

    const formData = new FormData();
    formData.append("calendarId", transferOwnershipDialog.calendarId);
    formData.append("targetUserId", transferOwnershipDialog.targetUserId);
    formData.append("role", "OWNER");
    await changeCalendarMemberRoleAction(formData);

    setTransferOwnershipDialog(null);
  };

  const confirmLeave = async () => {
    if (!leaveDialog) return;

    const formData = new FormData();
    formData.append("calendarId", leaveDialog.calendarId);
    const result = await leaveCalendarAction(formData);
    
    if (result.error) {
      alert(result.error);
    }

    setLeaveDialog(null);
  };

  const confirmDelete = async () => {
    if (!deleteDialog) return;

    const formData = new FormData();
    formData.append("calendarId", deleteDialog.calendarId);
    const result = await deleteCalendarAction(formData);
    
    if (result.error) {
      alert(result.error);
    }

    setDeleteDialog(null);
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

  const handleAddMember = (user: { id: string; name: string; email: string }) => {
    if (!selectedMembers.find(m => m.email === user.email)) {
      setSelectedMembers([...selectedMembers, { email: user.email, role: memberRole, name: user.name }]);
      setMemberEmail("");
      setSearchResults([]);
    }
  };

  const handleRemoveMember = (email: string) => {
    setSelectedMembers(selectedMembers.filter(m => m.email !== email));
  };

  const handleUpdateMemberRole = (email: string, newRole: string) => {
    setSelectedMembers(selectedMembers.map(m => 
      m.email === email ? { ...m, role: newRole } : m
    ));
  };

  const handleInviteMembers = async () => {
    if (!inviteDialog || selectedMembers.length === 0) return;
    
    setIsInviting(true);
    try {
      for (const member of selectedMembers) {
        const formData = new FormData();
        formData.append("calendarId", inviteDialog.calendarId);
        formData.append("userEmail", member.email);
        formData.append("role", member.role);
        const result = await addCalendarMemberAction(formData);
        
        if (result.error) {
          alert(`Failed to add ${member.email}: ${result.error}`);
        }
      }
      
      // Reset form
      setSelectedMembers([]);
      setMemberEmail("");
      setInviteDialog(null);
    } catch (error) {
      console.error("Failed to invite members:", error);
    } finally {
      setIsInviting(false);
    }
  };

  if (calendars.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        You don't belong to any calendars yet.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openCombobox}
              className="w-full sm:w-[300px] justify-between"
            >
              {selectedCalendar
                ? calendars.find((cal) => cal.id === selectedCalendar)?.name
                : "Select calendar..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search calendar..." />
              <CommandList>
                <CommandEmpty>No calendar found.</CommandEmpty>
                <CommandGroup>
                  {calendars.map((calendar) => (
                    <CommandItem
                      key={calendar.id}
                      value={calendar.name}
                      onSelect={() => {
                        setSelectedCalendar(calendar.id);
                        setOpenCombobox(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCalendar === calendar.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {calendar.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedCalendarData && (
          <div className="space-y-4">
            {selectedCalendarData.description && (
              <p className="text-sm text-muted-foreground">
                {selectedCalendarData.description}
              </p>
            )}

            {/* Calendar Actions */}
            <div className="flex gap-2">
              {(() => {
                const currentMember = selectedCalendarData.members.find(
                  (m) => m.userId === currentUserId
                );
                const isOwner = currentMember?.role === "OWNER";
                const canInvite = isOwner || currentMember?.role === "ADMIN";

                return (
                  <>
                    {canInvite && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() =>
                          setInviteDialog({
                            open: true,
                            calendarId: selectedCalendarData.id,
                            calendarName: selectedCalendarData.name,
                          })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Invite Members
                      </Button>
                    )}
                    {!isOwner && currentMember && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setLeaveDialog({
                            open: true,
                            calendarId: selectedCalendarData.id,
                            calendarName: selectedCalendarData.name,
                          })
                        }
                      >
                        Leave Calendar
                      </Button>
                    )}
                    {isOwner && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setDeleteDialog({
                            open: true,
                            calendarId: selectedCalendarData.id,
                            calendarName: selectedCalendarData.name,
                          })
                        }
                      >
                        Delete Calendar
                      </Button>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Member
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedCalendarData.members.map((m) => {
                      const isCurrentUser = m.userId === currentUserId;
                      const isOwner = m.role === "OWNER";
                      const canModify = !isCurrentUser || !isOwner;

                      return (
                        <tr key={m.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <div className="font-medium">
                                {m.user.name}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    (You)
                                  </span>
                                )}
                              </div>
                              <div className="text-muted-foreground text-xs hidden md:block">
                                {m.user.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{m.role}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Select
                                value={m.role}
                                onValueChange={(newRole) =>
                                  handleRoleChange(
                                    selectedCalendarData.id,
                                    m.user.id,
                                    newRole,
                                    m.role,
                                    selectedCalendarData.name,
                                    m.user.name
                                  )
                                }
                                disabled={!canModify}
                              >
                                <SelectTrigger className="w-24 md:w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="OWNER">Owner</SelectItem>
                                  <SelectItem value="EDITOR">Editor</SelectItem>
                                  <SelectItem value="VIEWER">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                              {!canModify && (
                                <span className="text-xs text-muted-foreground hidden md:block">
                                  Cannot remove own ownership
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={transferOwnershipDialog?.open || false}
        onOpenChange={(open) => {
          if (!open) setTransferOwnershipDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Ownership</DialogTitle>
            <DialogDescription>
              Are you sure you want to transfer ownership of{" "}
              <span className="font-semibold">
                {transferOwnershipDialog?.calendarName}
              </span>{" "}
              to{" "}
              <span className="font-semibold">
                {transferOwnershipDialog?.targetUserName}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action will make them the owner and demote you to an editor role.
              Only owners can transfer ownership back to you.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransferOwnershipDialog(null)}
            >
              Cancel
            </Button>
            <Button onClick={confirmOwnershipTransfer}>
              Confirm Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={leaveDialog?.open || false}
        onOpenChange={(open) => {
          if (!open) setLeaveDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Calendar</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave{" "}
              <span className="font-semibold">{leaveDialog?.calendarName}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You will no longer have access to this calendar or its events. You'll
              need to be re-invited by an owner or admin to rejoin.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmLeave}>
              Leave Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialog?.open || false}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Calendar</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteDialog?.calendarName}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. All events and member associations will
              be permanently deleted.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={inviteDialog?.open || false}
        onOpenChange={(open) => {
          if (!open) {
            setInviteDialog(null);
            setSelectedMembers([]);
            setMemberEmail("");
            setSearchResults([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invite Members</DialogTitle>
            <DialogDescription>
              Add members to{" "}
              <span className="font-semibold">{inviteDialog?.calendarName}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Search Users</Label>
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
            </div>

            {selectedMembers.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>Members to Invite ({selectedMembers.length})</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedMembers.map((member) => (
                      <div
                        key={member.email}
                        className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{member.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{member.email}</div>
                        </div>
                        <Select 
                          value={member.role} 
                          onValueChange={(role) => handleUpdateMemberRole(member.email, role)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VIEWER">Viewer</SelectItem>
                            <SelectItem value="EDITOR">Editor</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.email)}
                          className="h-8 w-8 p-0 shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setInviteDialog(null);
                setSelectedMembers([]);
                setMemberEmail("");
                setSearchResults([]);
              }}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleInviteMembers} 
              disabled={selectedMembers.length === 0 || isInviting}
            >
              {isInviting ? "Inviting..." : `Invite ${selectedMembers.length} Member${selectedMembers.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
