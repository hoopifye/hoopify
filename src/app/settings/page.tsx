import { getSession } from "@/lib/auth-actions";
import { prisma } from "@/lib/auth";
import {
    updateUsernameAction,
} from "@/lib/settings-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CalendarPermissionsManager } from "@/components/calendar-permissions-manager";
import { AvatarUploadDialog } from "@/components/avatar-upload-dialog";

export default async function SettingsPage({
    searchParams,
}: {
    searchParams?: any;
}) {
    const session = await getSession();
    if (!session?.user) {
        return (
            <div className="container mx-auto py-8 px-4">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">
                            Please sign in to access settings.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const params = (await searchParams) as { calendar_id?: string } | undefined;
    const preselectedCalendarId = params?.calendar_id;

    const userId = session.user.id as string;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    const calendars = await prisma.calendar.findMany({
        where: { members: { some: { userId } } },
        include: { members: { include: { user: true } } },
    });

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your account settings and preferences
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>
                            Update your username and avatar URL
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form action={updateUsernameAction} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={user?.name || ""}
                                    placeholder="Enter your name"
                                />
                            </div>
                            <Button type="submit">Save name</Button>
                        </form>

                        <Separator />

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Avatar</Label>
                                <div className="flex items-center gap-4">
                                    {user?.image && (
                                        <img
                                            src={user.image}
                                            alt="Current avatar"
                                            className="h-16 w-16 rounded-full object-cover border"
                                        />
                                    )}
                                    <AvatarUploadDialog currentAvatar={user?.image || ""} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Calendars & Permissions</CardTitle>
                        <CardDescription>
                            Manage member roles for calendars you belong to
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CalendarPermissionsManager 
                            calendars={calendars} 
                            currentUserId={userId}
                            preselectedCalendarId={preselectedCalendarId}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
