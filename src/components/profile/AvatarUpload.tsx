import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, User } from "lucide-react";
import { toast } from "sonner";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  fullName: string;
  onAvatarChange: (url: string) => void;
}

export function AvatarUpload({ userId, currentAvatarUrl, fullName, onAvatarChange }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      
      // Add cache-busting param
      const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;
      onAvatarChange(avatarUrl);
      toast.success("Avatar updated successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
          <AvatarImage src={currentAvatarUrl || undefined} alt={fullName} />
          <AvatarFallback className="text-xl bg-primary text-primary-foreground">
            {fullName ? getInitials(fullName) : <User className="w-8 h-8" />}
          </AvatarFallback>
        </Avatar>
        
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute bottom-0 right-0 rounded-full shadow-md h-8 w-8"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      
      <p className="text-xs text-muted-foreground text-center">
        Click the camera icon to upload<br />
        Max size: 2MB
      </p>
    </div>
  );
}
