import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

interface Props {
  currentImage?: string;
  onUpload: (url: string) => void;
}

export default function ImageUpload({ currentImage, onUpload }: Props) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || "");

  const handlePick = async () => {
    try {
      if (!user?.id) {
        Alert.alert("Error", "You must be logged in to upload an image.");
        return;
      }

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission required", "Please allow photo access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      setUploading(true);

      const asset = result.assets[0];
      const uri = asset.uri;

      setPreview(uri);

      const extension =
        uri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";

      const contentType =
        extension === "png"
          ? "image/png"
          : extension === "webp"
            ? "image/webp"
            : "image/jpeg";

      const fileName = `${user.id}/${Date.now()}.${extension}`;

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error } = await supabase.storage
        .from("recipe-images")
        .upload(fileName, arrayBuffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        console.log("Image upload error:", error);
        Alert.alert("Error", error.message || "Failed to upload image");
        return;
      }

      const { data } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(fileName);

      onUpload(data.publicUrl);
    } catch (err: any) {
      console.log("Image upload exception:", err);
      Alert.alert("Error", err?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview("");
    onUpload("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Recipe Image</Text>

      <TouchableOpacity
        style={styles.uploadArea}
        onPress={handlePick}
        activeOpacity={0.7}
        disabled={uploading}
      >
        {preview ? (
          <Image source={{ uri: preview }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>Tap to upload image</Text>
            <Text style={styles.placeholderSub}>PNG, JPG up to 5MB</Text>
          </View>
        )}

        {uploading && (
          <View style={styles.overlay}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}
      </TouchableOpacity>

      {preview ? (
        <TouchableOpacity onPress={handleRemove} disabled={uploading}>
          <Text style={styles.removeText}>Remove image</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  uploadArea: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.background,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  preview: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center" },
  placeholderIcon: { fontSize: 36, marginBottom: 8 },
  placeholderText: { fontSize: 14, color: colors.textMuted, marginBottom: 4 },
  placeholderSub: { fontSize: 12, color: colors.textFaint },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadingText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  removeText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
});