"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateUsernameAction } from "@/lib/settings-actions";

interface NameUpdateFormProps {
  defaultName: string;
}

export function NameUpdateForm({ defaultName }: NameUpdateFormProps) {
  const [name, setName] = useState(defaultName);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData();
    formData.append("name", name);

    // Dispatch optimistic update
    window.dispatchEvent(
      new CustomEvent("user-updated", { detail: { name } })
    );

    await updateUsernameAction(formData);
    setIsPending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save name"}
      </Button>
    </form>
  );
}
