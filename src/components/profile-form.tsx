"use client";

import { useState, useTransition } from "react";
import { updateUsernameAction } from "@/lib/settings-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
    defaultName: string;
}

export function ProfileForm({ defaultName }: ProfileFormProps) {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {
        setError(null);
        setSuccess(false);
        
        startTransition(async () => {
            try {
                await updateUsernameAction(formData);
                setSuccess(true);
                router.refresh();
            } catch (err: any) {
                setError(err.message || "Failed to update name");
            }
        });
    };

    return (
        <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    name="name"
                    defaultValue={defaultName}
                    placeholder="Enter your name"
                    disabled={isPending}
                />
            </div>
            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}
            {success && (
                <p className="text-sm text-green-600">Name updated successfully!</p>
            )}
            <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save name"}
            </Button>
        </form>
    );
}
