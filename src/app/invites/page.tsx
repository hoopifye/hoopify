"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Invite = {
  id: string;
  senderName: string;
  senderRole: "Owner" | "Admin";
  resourceName: string;
  resourceType: "Calendar" | "Project";
  inviteDate: Date;
  roleOffered: "Owner" | "Admin" | "Editor" | "Viewer";
};

// Hardcoded invites data
const hardcodedInvites: Invite[] = [
  {
    id: "1",
    senderName: "John Doe",
    senderRole: "Owner",
    resourceName: "Team Marketing Calendar",
    resourceType: "Calendar",
    inviteDate: new Date("2025-12-20"),
    roleOffered: "Editor",
  },
  {
    id: "2",
    senderName: "Jane Smith",
    senderRole: "Admin",
    resourceName: "Q1 Product Launch",
    resourceType: "Project",
    inviteDate: new Date("2025-12-28"),
    roleOffered: "Viewer",
  },
  {
    id: "3",
    senderName: "Mike Johnson",
    senderRole: "Owner",
    resourceName: "Company Events",
    resourceType: "Calendar",
    inviteDate: new Date("2026-01-02"),
    roleOffered: "Admin",
  },
];

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>(hardcodedInvites);

  const handleAcceptInvite = (inviteId: string) => {
    setInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
    // Here you would typically make an API call to accept the invite
    console.log(`Accepted invite: ${inviteId}`);
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

        <div className="space-y-4">
          {invites.length > 0 ? (
            invites.map((invite) => (
              <Card key={invite.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {invite.resourceName}
                      </CardTitle>
                      <CardDescription>
                        {invite.resourceType} • Invited by {invite.senderName} ({invite.senderRole})
                      </CardDescription>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {invite.inviteDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Role offered: </span>
                      <span className="font-medium">{invite.roleOffered}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptInvite(invite.id)}
                    >
                      Accept
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No pending invites
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
