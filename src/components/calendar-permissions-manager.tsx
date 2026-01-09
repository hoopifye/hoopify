"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, X, Link, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { changeCalendarMemberRoleAction, leaveCalendarAction, deleteCalendarAction, searchUsersByEmailAction, addCalendarMemberAction, removeCalendarMemberAction, transferCalendarOwnershipAction } from "@/lib/settings-actions";
import { createInviteLinkAction } from "@/lib/invite-actions";

type CalendarMember = {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  addedByUser?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
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
  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    calendarId: string;
    calendarName: string;
    targetUserId: string;
    targetUserName: string;
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
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLinkRole, setInviteLinkRole] = useState("VIEWER");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const selectedCalendarData = calendars.find((c) => c.id === selectedCalendar);

  const myCalendars = calendars.filter((calendar) =>
    calendar.members.some(
      (m) => m.userId === currentUserId && m.role === "OWNER"
    )
  );

  const sharedCalendars = calendars.filter((calendar) =>
    !calendar.members.some(
      (m) => m.userId === currentUserId && m.role === "OWNER"
    )
  );

  // Helper function to check if current user can modify a member
  const canModifyMember = (
    member: CalendarMember,
    currentUserRole: string
  ): boolean => {
    const isCurrentUser = member.userId === currentUserId;
    if (isCurrentUser) return false; // Can't modify yourself

    if (currentUserRole === "OWNER") return true; // Owner can modify anyone

    if (currentUserRole === "EDITOR") {
      // Editor cannot modify owner
      if (member.role === "OWNER") return false;
      // Editor cannot revoke other editors if they were added by owner
      if (member.role === "EDITOR" && member.addedByUser?.id !== currentUserId) {
        return false;
      }
      return true;
    }

    return false;
  };

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
    formData.append("newOwnerId", transferOwnershipDialog.targetUserId);
    const result = await transferCalendarOwnershipAction(formData);

    if (result.error) {
      alert(result.error);
    }

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

  const confirmRemoveMember = async () => {
    if (!removeDialog) return;

    const formData = new FormData();
    formData.append("calendarId", removeDialog.calendarId);
    formData.append("targetUserId", removeDialog.targetUserId);
    const result = await removeCalendarMemberAction(formData);
    
    if (result.error) {
      alert(result.error);
    }

    setRemoveDialog(null);
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

  const handleGenerateInviteLink = async () => {
    if (!inviteDialog) return;
    
    setIsGeneratingLink(true);
    try {
      const result = await createInviteLinkAction(inviteDialog.calendarId, inviteLinkRole);
      
      if (result.error) {
        alert(result.error);
      } else if (result.token) {
        const link = `${window.location.origin}/invite/${result.token}`;
        setInviteLink(link);
      }
    } catch (error) {
      console.error("Failed to generate invite link:", error);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!inviteLink) return;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
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
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search calendar..." />
              <CommandList>
                <CommandEmpty>No calendar found.</CommandEmpty>

                {myCalendars.length > 0 && (
                  <CommandGroup heading="Your Calendars">
                    {myCalendars.map((calendar) => {
                      const owner = calendar.members.find(
                        (m) => m.role === "OWNER"
                      )?.user;

                      return (
                        <CommandItem
                          key={calendar.id}
                          value={`${calendar.name} ${owner?.name || ""} ${owner?.email || ""}`}
                          onSelect={() => {
                            setSelectedCalendar(calendar.id);
                            setOpenCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              selectedCalendar === calendar.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{calendar.name}</span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}

                {myCalendars.length > 0 && sharedCalendars.length > 0 && (
                  <CommandSeparator />
                )}

                {sharedCalendars.length > 0 && (
                  <CommandGroup heading="Shared with You">
                    {sharedCalendars.map((calendar) => {
                      const owner = calendar.members.find(
                        (m) => m.role === "OWNER"
                      )?.user;

                      return (
                        <CommandItem
                          key={calendar.id}
                          value={`${calendar.name} ${owner?.name || ""} ${owner?.email || ""}`}
                          onSelect={() => {
                            setSelectedCalendar(calendar.id);
                            setOpenCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              selectedCalendar === calendar.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {owner && (
                            <Avatar className="h-6 w-6 mr-2 shrink-0">
                              <AvatarImage
                                src={owner.image || undefined}
                                alt={owner.name}
                              />
                              <AvatarFallback className="text-xs">
                                {owner.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex flex-col">
                            <span>{calendar.name}</span>
                            {owner && (
                              <span className="text-xs text-muted-foreground">
                                {owner.name}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
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
                const canInvite = isOwner || currentMember?.role === "EDITOR";

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
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Remove
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedCalendarData.members.map((m) => {
                      const isCurrentUser = m.userId === currentUserId;
                      const currentUserMember = selectedCalendarData.members.find(
                        (member) => member.userId === currentUserId
                      );
                      const currentUserRole = currentUserMember?.role || "VIEWER";
                      const canModify = canModifyMember(m, currentUserRole);
                      
                      let disabledReason = "";
                      if (isCurrentUser) {
                        disabledReason = "Cannot modify your own permissions";
                      } else if (currentUserRole === "EDITOR") {
                        if (m.role === "OWNER") {
                          disabledReason = "Cannot modify owner";
                        } else if (m.role === "EDITOR" && m.addedByUser?.id !== currentUserId) {
                          disabledReason = "Cannot modify editors added by owner";
                        }
                      }

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
                                  {disabledReason}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setRemoveDialog({
                                  open: true,
                                  calendarId: selectedCalendarData.id,
                                  calendarName: selectedCalendarData.name,
                                  targetUserId: m.userId,
                                  targetUserName: m.user.name,
                                })
                              }
                              disabled={!canModify}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
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
            setInviteLink(null);
            setLinkCopied(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col top-[10%] translate-y-0">
          <DialogHeader className="shrink-0">
            <DialogTitle>Invite Members</DialogTitle>
            <DialogDescription>
              Add members to{" "}
              <span className="font-semibold">{inviteDialog?.calendarName}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
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
                  <div className="space-y-2 h-[280px] overflow-y-auto pr-1">
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

            {/* Invite Link Section */}
            <Separator />
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Share Invite Link
              </Label>
              <p className="text-sm text-muted-foreground">
                Generate a link that anyone can use to join this calendar.
              </p>
              
              {!inviteLink ? (
                <div className="flex gap-2">
                  <Select value={inviteLinkRole} onValueChange={setInviteLinkRole}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                      <SelectItem value="EDITOR">Editor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={handleGenerateInviteLink}
                    disabled={isGeneratingLink}
                    className="flex-1"
                  >
                    {isGeneratingLink ? "Generating..." : "Generate Link"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={inviteLink}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyInviteLink}
                      className="shrink-0"
                    >
                      {linkCopied ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Anyone with this link can join as <span className="font-medium">{inviteLinkRole}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="shrink-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setInviteDialog(null);
                setSelectedMembers([]);
                setMemberEmail("");
                setSearchResults([]);
                setInviteLink(null);
                setLinkCopied(false);
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

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={removeDialog?.open || false} onOpenChange={(open) => {
        if (!open) setRemoveDialog(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold">{removeDialog?.targetUserName}</span> from{" "}
              <span className="font-semibold">{removeDialog?.calendarName}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRemoveDialog(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmRemoveMember}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
