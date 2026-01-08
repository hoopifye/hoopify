"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPendingInvitesAction, acceptInviteAction, declineInviteAction } from "@/lib/invite-actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Mail, Briefcase } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Invite = {
  id: string;
  senderName: string;
  resourceName: string;
  resourceType: string;
  inviteDate: Date;
  roleOffered: string;
};

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "",
    message: "",
  });

  const showAlert = (title: string, message: string) => {
    setDialog({ open: true, title, message });
  };

  const fetchInvites = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPendingInvitesAction();
      if ('error' in result && result.error) {
        showAlert("Error", result.error);
      } else if ('invites' in result) {
        setInvites(result.invites as Invite[]);
      }
    } catch (err) {
      console.error(err);
      showAlert("Error", "An unexpected error occurred while fetching invites.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      const result = await acceptInviteAction(inviteId);
      if (result.error) {
        showAlert("Error", result.error);
      } else {
        showAlert("Success", "Invitation accepted");
        setInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
      }
    } catch (err) {
      console.error(err);
      showAlert("Error", "Failed to accept invitation");
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      const result = await declineInviteAction(inviteId);
      if (result.error) {
        showAlert("Error", result.error);
      } else {
        showAlert("Success", "Invitation declined");
        setInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
      }
    } catch (err) {
      console.error(err);
      showAlert("Error", "Failed to decline invitation");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Invites</h1>
          <p className="text-muted-foreground mt-2">
            Manage your pending calendar and project invitations
          </p>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner className="w-8 h-8" />
            </div>
          ) : invites.length > 0 ? (
            invites.map((invite) => (
              <Card key={invite.id} className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {invite.resourceType === "Calendar" ? (
                      <Mail className="h-7 w-7 text-blue-500 shrink-0" />
                    ) : (
                      <Briefcase className="h-7 w-7 text-purple-500 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">
                        {invite.resourceName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        Invited by {invite.senderName} • {invite.roleOffered}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(invite.inviteDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeclineInvite(invite.id)}
                        className="h-7 px-2 text-xs"
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptInvite(invite.id)}
                        className="h-7 px-2 text-xs"
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-3">
              <p className="text-center text-sm text-muted-foreground">
                No pending invites
              </p>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={dialog.open} onOpenChange={(open) => setDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.title}</DialogTitle>
            <DialogDescription>{dialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDialog(prev => ({ ...prev, open: false }))}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
