import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

interface Recipe {
  id: string;
  title: string;
  description: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  image_url: string;
}

interface Profile {
  first_name: string;
  last_name: string;
  avatar_url: string;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    first_name: "",
    last_name: "",
    avatar_url: "",
  });
  const [form, setForm] = useState<Profile>({
    first_name: "",
    last_name: "",
    avatar_url: "",
  });
  const [newEmail, setNewEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const fetchData = async () => {
    const [recipesData, profileData] = await Promise.all([
      api.get("/api/recipes/my"),
      api.get("/api/profile"),
    ]);
    if (Array.isArray(recipesData)) setRecipes(recipesData);
    if (profileData && !profileData.error) {
      setProfile(profileData);
      setForm(profileData);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  const handleUpdateEmail = async () => {
    if (!newEmail) return;
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      setEmailMessage(error.message);
    } else {
      setEmailMessage("Confirmation sent to " + newEmail);
      setNewEmail("");
    }
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    setUploadingAvatar(true);
    const uri = result.assets[0].uri;
    const ext = uri.split(".").pop();
    const fileName = `${user!.id}/avatar.${ext}`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, blob, { upsert: true, contentType: `image/${ext}` });

    if (error) {
      Alert.alert("Error", "Failed to upload image");
      setUploadingAvatar(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    setForm((f) => ({ ...f, avatar_url: data.publicUrl }));
    setUploadingAvatar(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const data = await api.put("/api/profile", form);
    if (!data.error) {
      setProfile(form);
      setEditing(false);
      setEmailMessage("");
    }
    setSaving(false);
  };

  const displayName = profile.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : user?.email?.split("@")[0];

  if (loading)
    return (
      <ActivityIndicator
        style={{ flex: 1 }}
        size="large"
        color={colors.primary}
      />
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <View>
            {/* Profile card */}
            <View style={styles.profileCard}>
              {!editing ? (
                <View>
                  <View style={styles.profileRow}>
                    <View style={styles.avatarContainer}>
                      {profile.avatar_url ? (
                        <Image
                          source={{ uri: profile.avatar_url }}
                          style={styles.avatar}
                        />
                      ) : (
                        <Text style={styles.avatarText}>
                          {displayName?.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.displayName}>{displayName}</Text>
                      <Text style={styles.email}>{user?.email}</Text>
                      <Text style={styles.recipeCount}>
                        {recipes.length} recipes created
                      </Text>
                    </View>
                  </View>
                  <View style={styles.profileActions}>
                    <TouchableOpacity
                      style={styles.editProfileBtn}
                      onPress={() => setEditing(true)}
                    >
                      <Text style={styles.editProfileBtnText}>
                        Edit Profile
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.signOutBtn}
                      onPress={signOut}
                    >
                      <Text style={styles.signOutBtnText}>Sign out</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <Text style={styles.editTitle}>Edit Profile</Text>

                  {/* Avatar picker */}
                  <TouchableOpacity
                    style={styles.avatarPicker}
                    onPress={handlePickAvatar}
                    disabled={uploadingAvatar}
                  >
                    <View style={styles.avatarLarge}>
                      {form.avatar_url ? (
                        <Image
                          source={{ uri: form.avatar_url }}
                          style={styles.avatarLargeImg}
                        />
                      ) : (
                        <Text style={styles.avatarLargeText}>
                          {form.first_name?.charAt(0).toUpperCase() ||
                            user?.email?.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.changePhotoText}>
                      {uploadingAvatar ? "Uploading..." : "Change photo"}
                    </Text>
                  </TouchableOpacity>

                  {/* Name fields */}
                  <View style={styles.formRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>First Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="First name"
                        placeholderTextColor={colors.textMuted}
                        value={form.first_name}
                        onChangeText={(v) =>
                          setForm((f) => ({ ...f, first_name: v }))
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Last Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Last name"
                        placeholderTextColor={colors.textMuted}
                        value={form.last_name}
                        onChangeText={(v) =>
                          setForm((f) => ({ ...f, last_name: v }))
                        }
                      />
                    </View>
                  </View>

                  {/* Email update */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={styles.label}>Update Email</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textMuted,
                        marginBottom: 6,
                      }}
                    >
                      Current: {user?.email}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="New email address"
                        placeholderTextColor={colors.textMuted}
                        value={newEmail}
                        onChangeText={setNewEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                      <TouchableOpacity
                        style={styles.emailUpdateBtn}
                        onPress={handleUpdateEmail}
                      >
                        <Text style={styles.emailUpdateBtnText}>Update</Text>
                      </TouchableOpacity>
                    </View>
                    {emailMessage ? (
                      <Text
                        style={[
                          styles.emailMessage,
                          {
                            color: emailMessage.includes("sent")
                              ? "#2e7d32"
                              : colors.danger,
                            backgroundColor: emailMessage.includes("sent")
                              ? "#f1f8e9"
                              : colors.dangerLight,
                          },
                        ]}
                      >
                        {emailMessage}
                      </Text>
                    ) : null}
                  </View>

                  {/* Action buttons */}
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        setEditing(false);
                        setForm(profile);
                        setEmailMessage("");
                        setNewEmail("");
                      }}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={handleSave}
                      disabled={saving}
                    >
                      <Text style={styles.saveBtnText}>
                        {saving ? "Saving..." : "Save Changes"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* My recipes header */}
            <View style={styles.recipesHeader}>
              <Text style={styles.recipesTitle}>My Recipes</Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigation.navigate("CreateRecipe")}
              >
                <Text style={styles.createBtnText}>+ Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No recipes yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first recipe to get started
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("RecipeDetail", { id: item.id })}
            activeOpacity={0.7}
          >
            <View style={styles.cardImage}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <Text style={{ fontSize: 36 }}>🍽️</Text>
              )}
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.cardMeta}>
                <Text style={styles.metaText}>
                  ⏱ {item.prep_time + item.cook_time}min
                </Text>
                <Text style={styles.metaText}>👤 {item.servings} servings</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    margin: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatar: { width: "100%", height: "100%" },
  avatarText: { fontSize: 24, fontWeight: "700", color: colors.primary },
  displayName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  email: { fontSize: 13, color: colors.textMuted, marginBottom: 2 },
  recipeCount: { fontSize: 13, color: colors.textFaint },
  profileActions: { flexDirection: "row", gap: 8 },
  editProfileBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  editProfileBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  signOutBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerLight,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  signOutBtnText: { fontSize: 14, fontWeight: "500", color: colors.danger },
  editTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 20,
  },
  avatarPicker: { alignItems: "center", marginBottom: 20 },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: colors.border,
  },
  avatarLargeImg: { width: "100%", height: "100%" },
  avatarLargeText: { fontSize: 32, fontWeight: "700", color: colors.primary },
  changePhotoText: { color: colors.primary, fontSize: 13, marginTop: 8 },
  formRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    backgroundColor: colors.background,
    color: colors.textPrimary,
  },
  emailUpdateBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  emailUpdateBtnText: { color: colors.white, fontWeight: "600", fontSize: 13 },
  emailMessage: { fontSize: 12, marginTop: 6, padding: 8, borderRadius: 8 },
  editActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, color: colors.textSecondary },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 14, fontWeight: "600", color: colors.white },
  recipesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  recipesTitle: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  createBtnText: { color: colors.white, fontSize: 14, fontWeight: "600" },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardImage: {
    width: "100%",
    height: 140,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { padding: 14 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
    lineHeight: 20,
  },
  cardMeta: { flexDirection: "row", gap: 16 },
  metaText: { fontSize: 13, color: colors.textFaint },
  empty: { alignItems: "center", paddingTop: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
