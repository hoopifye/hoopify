"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, CheckCircle, XCircle } from "lucide-react";
import { getInviteLinkDetailsAction, acceptInviteLinkAction } from "@/lib/invite-actions";

interface InviteDetails {
  resourceName: string;
  resourceType: string;
  role: string;
  senderName: string;
  senderImage: string | null;
}

export default function InviteLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();
  const [token, setToken] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Resolve params
  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  // Fetch invite details
  useEffect(() => {
    if (!token) return;

    async function fetchDetails() {
      setIsLoading(true);
      const result = await getInviteLinkDetailsAction(token!);
      
      if (result.error) {
        setError(result.error);
      } else {
        setInviteDetails({
          resourceName: result.resourceName!,
          resourceType: result.resourceType!,
          role: result.role!,
          senderName: result.senderName!,
          senderImage: result.senderImage || null,
        });
      }
      setIsLoading(false);
    }

    fetchDetails();
  }, [token]);

  const handleJoin = async () => {
    if (!token) return;
    
    setIsJoining(true);
    const result = await acceptInviteLinkAction(token);
    
    if (result.error) {
      if (result.needsAuth) {
        // Redirect to login with return URL
        router.push(`/auth?callbackUrl=/invite/${token}`);
        return;
      }
      setError(result.error);
    } else {
      setSuccess(true);
      // Redirect to calendar after short delay
      setTimeout(() => {
        router.push("/calendar");
      }, 2000);
    }
    setIsJoining(false);
  };

  // If not logged in, show login prompt
  if (!isSessionLoading && !session?.user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Calendar Invitation</CardTitle>
            <CardDescription>
              You need to sign in to join this calendar
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={() => router.push(`/auth?callbackUrl=/invite/${token}`)}>
              Sign In to Continue
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account? You can create one when you sign in.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading || isSessionLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  // Error state
  if (error && !success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push("/calendar")}>
              Go to Calendar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle>Joined Successfully!</CardTitle>
            <CardDescription>
              You are now a member of {inviteDetails?.resourceName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              Redirecting to calendar...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invite details state
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Calendar Invitation</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join a calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="text-center">
              <h3 className="font-semibold text-lg">{inviteDetails?.resourceName}</h3>
              <p className="text-sm text-muted-foreground">
                You&apos;ll join as <span className="font-medium">{inviteDetails?.role}</span>
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Invited by</span>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={inviteDetails?.senderImage || undefined} />
                  <AvatarFallback className="text-xs">
                    {inviteDetails?.senderName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{inviteDetails?.senderName}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleJoin} disabled={isJoining}>
              {isJoining ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Joining...
                </>
              ) : (
                "Join Calendar"
              )}
            </Button>
            <Button variant="outline" onClick={() => router.push("/calendar")}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
