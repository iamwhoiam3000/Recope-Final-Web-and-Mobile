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
  TextInput,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import ReviewSection from "../components/ReviewSection";

export default function RecipeDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { id } = route.params;

  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [cooking, setCooking] = useState(false);
  const [adjustedServings, setAdjustedServings] = useState<number>(1);
  const [nutrition, setNutrition] = useState<any>(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [substitutions, setSubstitutions] = useState<any[]>([]);
  const [substitutionsLoading, setSubstitutionsLoading] = useState(false);

  const fetchRecipe = async () => {
    setLoading(true);

    const data = await api.get(`/api/recipes/${id}`);
    if (data.id) {
  setRecipe(data);
  setAdjustedServings(data.servings || 1);

  setNutritionLoading(true);

  const nutritionData = await api.post("/api/ai/nutrition", {
    title: data.title,
    servings: data.servings,
    ingredients: data.ingredients || [],
  });

  if (!nutritionData.error) {
    setNutrition(nutritionData);
  }

  setNutritionLoading(false);

  setSubstitutionsLoading(true);

const substitutionsData = await api.post("/api/ai/substitutions", {
  title: data.title,
  ingredients: data.ingredients || [],
});

if (!substitutionsData.error) {
  setSubstitutions(substitutionsData.substitutions || []);
}

setSubstitutionsLoading(false);
}

    const favs = await api.get("/api/favorites");
    if (Array.isArray(favs)) {
      setIsFavorite(favs.some((f: any) => f.recipe_id === id));
    }

    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchRecipe();
    }, [id]),
  );

  const handleCookRecipe = async () => {
    if (cooking) return;

    Alert.alert(
      "Cook Recipe",
      "This will deduct the recipe ingredients from your pantry. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Cook",
          onPress: async () => {
            setCooking(true);

            try {
              const data = await api.post(`/api/recipes/${id}/cook`, {});

              if (data.error) {
                Alert.alert("Cannot Cook Recipe", data.error);
                return;
              }

              const deductionText =
                data.deductions?.length > 0
                  ? data.deductions
                      .map((item: any) =>
                        item.removed
                          ? `• ${item.name}: removed from pantry`
                          : `• ${item.name}: ${item.before} → ${item.after} ${
                              item.unit || ""
                            }`,
                      )
                      .join("\n")
                  : "";

              Alert.alert(
                "Recipe Cooked",
                `${data.message || "Recipe cooked successfully!"}${
                  deductionText ? `\n\nPantry updated:\n${deductionText}` : ""
                }`,
                [
                  {
                    text: "View Pantry",
                    onPress: () =>
                      navigation.navigate("Main", { screen: "Pantry" }),
                  },
                  {
                    text: "OK",
                    style: "cancel",
                  },
                ],
              );

              fetchRecipe();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.message || "Something went wrong while cooking.",
              );
            } finally {
              setCooking(false);
            }
          },
        },
      ],
    );
  };

  const handleToggleFavorite = async () => {
    setFavoriteLoading(true);

    if (isFavorite) {
      const data = await api.remove(`/api/favorites/${id}`);
      if (!data.error) setIsFavorite(false);
    } else {
      const data = await api.post("/api/favorites", { recipe_id: id });
      if (!data.error) setIsFavorite(true);
    }

    setFavoriteLoading(false);
  };

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

            navigation.navigate("Main", { screen: "Home" });
          },
        },
      ],
    );
  };

  const parseAmount = (value: string): number | null => {
  if (!value) return null;

  const str = String(value).trim();

  if (str.includes(" ")) {
    const [whole, fraction] = str.split(" ");
    const parsedFraction = parseAmount(fraction);
    return (Number(whole) || 0) + (parsedFraction || 0);
  }

  if (str.includes("/")) {
    const [num, den] = str.split("/").map(Number);
    if (!num || !den) return null;
    return num / den;
  }

  const num = Number(str);
  return isNaN(num) ? null : num;
};

const formatAmount = (value: number): string => {
  const rounded = Math.round(value * 1000) / 1000;

  const whole = Math.floor(rounded);
  const decimal = Math.round((rounded - whole) * 1000) / 1000;

  const fractions: Record<string, string> = {
    "0.125": "1/8",
    "0.25": "1/4",
    "0.333": "1/3",
    "0.375": "3/8",
    "0.5": "1/2",
    "0.625": "5/8",
    "0.667": "2/3",
    "0.75": "3/4",
    "0.875": "7/8",
  };

  const key = decimal.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");

  if (fractions[key]) {
    return whole > 0 ? `${whole} ${fractions[key]}` : fractions[key];
  }

  if (Number.isInteger(rounded)) {
    return String(rounded);
  }

  return rounded.toFixed(2).replace(/\.00$/, "").replace(/0$/, "");
};

const getAdjustedAmount = (amount: string) => {
  if (!recipe) return amount;

  const parsed = parseAmount(amount);
  if (parsed === null) return amount;

  const ratio = adjustedServings / recipe.servings;
  return formatAmount(parsed * ratio);
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

  const getMealTypes = (mealType: string | string[] | null | undefined) => {
    if (Array.isArray(mealType)) return mealType;
    if (typeof mealType === "string" && mealType.trim()) return [mealType];
    return [];
  };

    return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.hero}>
          {recipe.image_url ? (
            <Image
  source={{ uri: recipe.image_url }}
  style={styles.heroImage}
  resizeMode="cover"
  fadeDuration={0}
/>
          ) : (
            <Text style={styles.heroEmoji}>🍽️</Text>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{recipe.title}</Text>

          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
            disabled={favoriteLoading}
          >
            <Text style={styles.favoriteButtonText}>
              {isFavorite ? "❤️ Favorited" : "🤍 Add to Favorites"}
            </Text>
          </TouchableOpacity>

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

          {(getMealTypes(recipe.meal_type).length > 0 ||
            recipe.cuisine_type ||
            recipe.cook_duration) && (
            <View style={styles.badges}>
              {getMealTypes(recipe.meal_type).map((type: string) => (
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

          <View style={styles.section}>
  <Text style={styles.sectionTitle}>
    🍎 Estimated Nutrition (Per Serving)
  </Text>

  {nutritionLoading ? (
    <Text>Calculating nutrition...</Text>
  ) : nutrition ? (
    <>
      <Text>🔥 Calories: {nutrition.calories} kcal</Text>
      <Text>🥩 Protein: {nutrition.protein} g</Text>
      <Text>🥑 Fat: {nutrition.fat} g</Text>
      <Text>🍚 Carbohydrates: {nutrition.carbohydrates} g</Text>
    </>
  ) : (
    <Text>No nutrition data available.</Text>
  )}

  <Text
    style={{
      marginTop: 8,
      fontSize: 12,
      color: colors.textMuted,
      fontStyle: "italic",
    }}
  >
    *Estimated using AI from the recipe ingredients.
  </Text>
</View>

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

          <View style={styles.section}>
  <Text style={styles.sectionTitle}>
    💡 Alternative Ingredient Suggestions
  </Text>

  {substitutionsLoading ? (
    <Text>Finding alternatives...</Text>
  ) : substitutions.length > 0 ? (
    substitutions.map((item: any, index: number) => (
      <View key={index} style={{ marginBottom: 12 }}>
        <Text style={{ fontWeight: "700", color: colors.textPrimary }}>
          {item.ingredient}
        </Text>

        <Text style={{ color: colors.textSecondary }}>
          Try: {item.alternatives?.join(", ")}
        </Text>
      </View>
    ))
  ) : (
    <Text>No substitution suggestions available.</Text>
  )}

  <Text
    style={{
      marginTop: 8,
      fontSize: 12,
      color: colors.textMuted,
      fontStyle: "italic",
    }}
  >
    AI-generated substitution suggestions.
  </Text>
</View>

          <View style={styles.section}>
  <Text style={styles.sectionTitle}>Serving Adjustment</Text>

  <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>
    Original: {recipe.servings} serving(s)
  </Text>

  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
    <Text style={{ color: colors.textPrimary }}>Adjust to:</Text>

    <TextInput
      value={String(adjustedServings)}
      keyboardType="number-pad"
      onChangeText={(text) => {
        const value = Number(text);
        setAdjustedServings(value > 0 ? value : 1);
      }}
      style={{
        width: 70,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 8,
        textAlign: "center",
        color: colors.textPrimary,
      }}
    />

    <Text style={{ color: colors.textPrimary }}>serving(s)</Text>
  </View>
</View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>

            {recipe.ingredients?.map((ing: any) => (
              <View key={ing.id} style={styles.ingredientRow}>
                <View style={styles.ingredientDot} />
                <Text style={styles.ingredientAmount}>
                  {getAdjustedAmount(ing.amount)} {ing.unit}
                </Text>
                <Text style={styles.ingredientName}>{ing.name}</Text>
              </View>
            ))}
          </View>

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

          <ReviewSection recipeId={id} />
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.cookButton, cooking && styles.disabledButton]}
          activeOpacity={0.7}
          onPress={handleCookRecipe}
          disabled={cooking}
        >
          <Text style={styles.cookButtonText}>
            {cooking ? "Cooking..." : "Cook Recipe"}
          </Text>
        </TouchableOpacity>

        {isOwner && (
          <>
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
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  favoriteButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  favoriteButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },
  cookButton: {
    flex: 1,
    backgroundColor: "#40916c",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  cookButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.6,
  },
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
  authorAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  authorLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  metaCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  metaLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
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
  ingredientAmount: {
    fontSize: 14,
    color: colors.textSecondary,
    minWidth: 60,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
    flex: 1,
  },
  stepRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepNumberText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
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
  editButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 15,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerLight,
    borderRadius: 10,
    padding: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  deleteButtonText: {
    color: colors.danger,
    fontWeight: "600",
    fontSize: 15,
  },
});
