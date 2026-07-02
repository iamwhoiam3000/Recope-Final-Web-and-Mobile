import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

interface Props {
  currentImage?: string;
  onUpload: (url: string) => void;
}

export default function ImageUpload({ currentImage, onUpload }: Props) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || "");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${user!.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("recipe-images")
      .upload(fileName, file, {
  upsert: true,
  contentType: file.type,
});

    if (error) {
      console.error("Upload error:", error);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("recipe-images")
      .getPublicUrl(fileName);

    onUpload(`${data.publicUrl}?t=${Date.now()}`);
    setUploading(false);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <label
        style={{
          display: "block",
          fontSize: 14,
          fontWeight: 600,
          color: "#444",
          marginBottom: 8,
        }}
      >
        Recipe Image
      </label>
      <div
        style={{
          width: "100%",
          height: 220,
          borderRadius: 12,
          border: "2px dashed #eee",
          backgroundColor: "#f4faf7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          cursor: "pointer",
        }}
        onClick={() => document.getElementById("image-upload")?.click()}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ textAlign: "center", color: "#bbb" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
            <p style={{ fontSize: 14 }}>Click to upload image</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>PNG, JPG up to 5MB</p>
          </div>
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
            <p style={{ color: "#2d6a4f", fontWeight: 600 }}>Uploading...</p>
          </div>
        )}
      </div>
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      {preview && (
        <button
          type="button"
          onClick={() => {
            setPreview("");
            onUpload("");
          }}
          style={{
            background: "none",
            border: "none",
            color: "#999",
            fontSize: 13,
            marginTop: 8,
          }}
        >
          Remove image
        </button>
      )}
    </div>
  );
}
