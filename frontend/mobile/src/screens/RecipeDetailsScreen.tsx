import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

export default function RecipeDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { id } = route.params;
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchRecipe = async () => {
    const data = await api.get(`/api/recipes/${id}`);
    if (data.id) setRecipe(data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchRecipe();
    }, [id]),
  );

  const handleDelete = () => {
    Alert.alert(
      "Delete Recipe",
      "Are you sure you want to delete this recipe?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const data = await api.remove(`/api/recipes/${id}`);
            if (data.error) {
              Alert.alert("Error", data.error);
              setDeleting(false);
              return;
            }
            navigation.goBack();
          },
        },
      ],
    );
  };

  if (loading)
    return (
      <ActivityIndicator
        style={{ flex: 1 }}
        size="large"
        color={colors.primary}
      />
    );

  if (!recipe)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.textMuted }}>Recipe not found.</Text>
      </View>
    );

  const isOwner = user?.id === recipe.user_id;

  const getAuthorName = (profiles: any) => {
    if (!profiles) return "Unknown";
    if (profiles.first_name)
      return `${profiles.first_name} ${profiles.last_name || ""}`.trim();
    return profiles.username || "Unknown";
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero image */}
        <View style={styles.hero}>
          {recipe.image_url ? (
            <Image
              source={{ uri: recipe.image_url }}
              style={styles.heroImage}
            />
          ) : (
            <Text style={styles.heroEmoji}>🍽️</Text>
          )}
        </View>

        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{recipe.title}</Text>

          {/* Author */}
          <View style={styles.authorRow}>
            <View style={styles.authorAvatar}>
              {recipe.profiles?.avatar_url ? (
                <Image
                  source={{ uri: recipe.profiles.avatar_url }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <Text style={styles.authorAvatarText}>
                  {getAuthorName(recipe.profiles).charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View>
              <Text style={styles.authorName}>
                {getAuthorName(recipe.profiles)}
              </Text>
              <Text style={styles.authorLabel}>Recipe author</Text>
            </View>
          </View>

          {/* Category badges */}
          {(recipe.meal_type?.length > 0 ||
            recipe.cuisine_type ||
            recipe.cook_duration) && (
            <View style={styles.badges}>
              {Array.isArray(recipe.meal_type) &&
                recipe.meal_type.map((type: string) => (
                  <View
                    key={type}
                    style={[styles.badge, { backgroundColor: "#fdf3e7" }]}
                  >
                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                      {type}
                    </Text>
                  </View>
                ))}
              {recipe.cuisine_type && (
                <View style={[styles.badge, { backgroundColor: "#f0f0f0" }]}>
                  <Text style={[styles.badgeText, { color: "#666" }]}>
                    {recipe.cuisine_type}
                  </Text>
                </View>
              )}
              {recipe.cook_duration && (
                <View style={[styles.badge, { backgroundColor: "#f0f7ff" }]}>
                  <Text style={[styles.badgeText, { color: "#1976d2" }]}>
                    {recipe.cook_duration}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Text style={styles.description}>{recipe.description}</Text>

          {/* Meta cards */}
          <View style={styles.metaRow}>
            {[
              { label: "Prep", value: `${recipe.prep_time}min` },
              { label: "Cook", value: `${recipe.cook_time}min` },
              { label: "Serves", value: recipe.servings },
              { label: "Views", value: recipe.view_count || 0 },
            ].map((item) => (
              <View key={item.label} style={styles.metaCard}>
                <Text style={styles.metaValue}>{item.value}</Text>
                <Text style={styles.metaLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients?.map((ing: any) => (
              <View key={ing.id} style={styles.ingredientRow}>
                <View style={styles.ingredientDot} />
                <Text style={styles.ingredientAmount}>
                  {ing.amount} {ing.unit}
                </Text>
                <Text style={styles.ingredientName}>{ing.name}</Text>
              </View>
            ))}
          </View>

          {/* Steps */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Steps</Text>
            {recipe.steps?.map((step: any, index: number) => (
              <View key={step.id} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step.instruction}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Fixed action buttons OUTSIDE ScrollView */}
      {isOwner && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("EditRecipe", { editId: id })}
          >
            <Text style={styles.editButtonText}>Edit Recipe</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            activeOpacity={0.7}
            onPress={handleDelete}
            disabled={deleting}
          >
            <Text style={styles.deleteButtonText}>
              {deleting ? "Deleting..." : "Delete"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    height: 240,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: { width: "100%", height: "100%" },
  heroEmoji: { fontSize: 80 },
  content: { padding: 20 },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  authorAvatarText: { fontSize: 14, fontWeight: "700", color: colors.primary },
  authorName: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  authorLabel: { fontSize: 12, color: colors.textMuted },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  metaRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  metaCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaValue: { fontSize: 16, fontWeight: "700", color: colors.primary },
  metaLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  section: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 14,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  ingredientAmount: { fontSize: 14, color: colors.textSecondary, minWidth: 60 },
  ingredientName: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
    flex: 1,
  },
  stepRow: { flexDirection: "row", gap: 14, marginBottom: 16 },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepNumberText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    paddingTop: 4,
  },
  actions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  editButtonText: { color: colors.white, fontWeight: "600", fontSize: 15 },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerLight,
    borderRadius: 10,
    padding: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  deleteButtonText: { color: colors.danger, fontWeight: "600", fontSize: 15 },
});
