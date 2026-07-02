import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

interface Props {
  currentAvatar?: string;
  firstName?: string;
  onUpload: (url: string) => void;
}

const GREEN = {
  primary: "#2d6a4f",
  light: "#f0f7f4",
  mid: "#d0e8dc",
};

export default function AvatarUpload({
  currentAvatar,
  firstName,
  onUpload,
}: Props) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentAvatar || "");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${user!.id}/avatar.${ext}`;

    const { error } = await supabase.storage
  .from("avatars")
  .upload(fileName, file, {
    upsert: true,
    contentType: file.type,
  });

    if (error) {
      console.error("Upload error:", error);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    onUpload(`${data.publicUrl}?t=${Date.now()}`);
    setUploading(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: 24,
      }}
    >
      <div
        onClick={() => document.getElementById("avatar-upload")?.click()}
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: GREEN.light,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          cursor: "pointer",
          border: `3px solid ${GREEN.mid}`,
          position: "relative",
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Avatar"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 36, fontWeight: 700, color: GREEN.primary }}>
            {firstName?.charAt(0).toUpperCase() ||
              user?.email?.charAt(0).toUpperCase()}
          </span>
        )}
        {uploading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(255,255,255,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 11, color: GREEN.primary }}>...</span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => document.getElementById("avatar-upload")?.click()}
        style={{
          background: "none",
          border: "none",
          color: GREEN.primary,
          fontSize: 13,
          marginTop: 8,
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        {uploading ? "Uploading..." : "Change photo"}
      </button>
      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
