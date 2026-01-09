"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateAvatarAction } from "@/lib/settings-actions";
import { Upload, Link as LinkIcon } from "lucide-react";

type AvatarUploadDialogProps = {
  currentAvatar?: string;
};

export function AvatarUploadDialog({ currentAvatar }: AvatarUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatar || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = async () => {
    const formData = new FormData();
    formData.append("image", avatarUrl);
    
    // Dispatch event for optimistic update
    window.dispatchEvent(new CustomEvent("avatar-updated", { detail: avatarUrl }));
    
    await updateAvatarAction(formData);
    setOpen(false);
  };

  const handleFileSubmit = async () => {
    if (!selectedFile) return;
    
    // Convert file to base64 or upload to a service
    // For now, we'll use base64 which may not be ideal for production
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      
      // Dispatch event for optimistic update
      window.dispatchEvent(new CustomEvent("avatar-updated", { detail: base64String }));
      
      const formData = new FormData();
      formData.append("image", base64String);
      await updateAvatarAction(formData);
      setOpen(false);
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Change Avatar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] top-[20%] translate-y-0">
        <DialogHeader>
          <DialogTitle>Update Avatar</DialogTitle>
          <DialogDescription>
            Choose an avatar by pasting a URL or uploading an image file.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="mt-4">
            <div className="space-y-4 min-h-[280px] flex flex-col">
              <div className="space-y-2">
                <Label htmlFor="avatar-url">Avatar URL</Label>
                <Input
                  id="avatar-url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2 flex-1">
                <Label>Preview</Label>
                <div className="flex items-center justify-center p-4 border rounded-lg bg-muted/50 h-full min-h-[140px]">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar preview"
                      className="h-24 w-24 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "";
                        e.currentTarget.alt = "Failed to load image";
                      }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">Enter a URL to preview</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUrlSubmit} disabled={!avatarUrl}>
                  Save Avatar
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <div className="space-y-4 min-h-[280px] flex flex-col">
              <div className="space-y-2">
                <Label htmlFor="avatar-file">Choose Image</Label>
                <Input
                  id="avatar-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground">
                  Accepts JPG, PNG, GIF. Max size: 5MB
                </p>
              </div>

              <div className="space-y-2 flex-1">
                <Label>Preview</Label>
                <div className="flex items-center justify-center p-4 border rounded-lg bg-muted/50 h-full min-h-[140px]">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Avatar preview"
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a file to preview</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleFileSubmit} disabled={!selectedFile}>
                  Upload Avatar
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
