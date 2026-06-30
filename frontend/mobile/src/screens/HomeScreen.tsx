import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import api from "../lib/api";
import { colors } from "../theme";

interface Recipe {
  id: string;
  title: string;
  description: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  image_url: string;
  meal_type: string[];
  cuisine_type: string;
  cook_duration: string;
  view_count: number;
  created_at: string;
  profiles: {
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
  matchedCount?: number;
  totalCount?: number;
  matchPercent?: number;
}

const PREVIEW_COUNT = 4;

export default function HomeScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [matched, setMatched] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [showAllPopular, setShowAllPopular] = useState(false);
  const navigation = useNavigation<any>();

  const fetchData = async () => {
    const [recipesData, matchedData] = await Promise.all([
      api.get("/api/recipes"),
      api.get("/api/pantry/match"),
    ]);
    if (Array.isArray(recipesData)) setRecipes(recipesData);
    if (Array.isArray(matchedData)) setMatched(matchedData);
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  const filtered = recipes.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()),
  );

  const recentRecipes = [...recipes].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const popularRecipes = [...recipes].sort(
    (a, b) => b.view_count - a.view_count,
  );

  const isFiltering = search.length > 0;

  const getAuthorName = (profiles: Recipe["profiles"]) => {
    if (!profiles) return "Unknown";
    if (profiles.first_name)
      return `${profiles.first_name} ${profiles.last_name || ""}`.trim();
    return profiles.username || "Unknown";
  };

  if (loading)
    return (
      <ActivityIndicator
        style={{ flex: 1 }}
        size="large"
        color={colors.primary}
      />
    );

  const RecipeCard = ({
    item,
    highlighted = false,
  }: {
    item: Recipe;
    highlighted?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.card, highlighted && styles.cardHighlighted]}
      onPress={() => navigation.navigate("RecipeDetail", { id: item.id })}
      activeOpacity={0.7}
    >
      {/* Match badge */}
      {highlighted && item.matchPercent !== undefined && (
        <View style={styles.matchBadge}>
          <Text style={styles.matchBadgeText}>{item.matchPercent}% match</Text>
        </View>
      )}

      {/* Image */}
      <View style={styles.cardImage}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <Text style={styles.cardEmoji}>🍽️</Text>
        )}
      </View>

      <View style={styles.cardBody}>
        {/* Category badges */}
        {(item.meal_type?.length > 0 ||
          item.cuisine_type ||
          item.cook_duration) && (
          <View style={styles.badges}>
            {Array.isArray(item.meal_type) &&
              item.meal_type.map((type: string) => (
                <View
                  key={type}
                  style={[
                    styles.badge,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: colors.primary }]}>
                    {type}
                  </Text>
                </View>
              ))}
            {item.cuisine_type && (
              <View style={[styles.badge, { backgroundColor: "#f0f0f0" }]}>
                <Text style={[styles.badgeText, { color: "#666" }]}>
                  {item.cuisine_type}
                </Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Author */}
        <View style={styles.authorRow}>
          <View style={styles.authorAvatar}>
            {item.profiles?.avatar_url ? (
              <Image
                source={{ uri: item.profiles.avatar_url }}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <Text style={styles.authorAvatarText}>
                {getAuthorName(item.profiles).charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={styles.authorName}>
            by {getAuthorName(item.profiles)}
          </Text>
        </View>

        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>
            ⏱ {item.prep_time + item.cook_time}min
          </Text>
          <Text style={styles.metaText}>👤 {item.servings} servings</Text>
          {item.view_count > 0 && (
            <Text style={styles.metaText}>👁 {item.view_count}</Text>
          )}
        </View>

        {highlighted && item.matchedCount !== undefined && (
          <Text style={styles.matchText}>
            {item.matchedCount} of {item.totalCount} ingredients available
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({
    title,
    subtitle,
    showAll,
    onToggle,
    total,
  }: {
    title: string;
    subtitle: string;
    showAll: boolean;
    onToggle: () => void;
    total: number;
  }) => (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
      {total > PREVIEW_COUNT && (
        <TouchableOpacity onPress={onToggle} style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>
            {showAll ? "Show Less ↑" : `See All (${total})`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const listData = [
    { key: "search" },
    { key: "create" },
    ...(matched.length > 0
      ? [
          { key: "pantry_header" },
          ...matched.slice(0, 3).map((r) => ({
            key: `pantry_${r.id}`,
            recipe: r,
            highlighted: true,
          })),
        ]
      : []),
    { key: "divider" },
    ...(isFiltering
      ? [
          { key: "search_header" },
          ...filtered.map((r) => ({ key: `filtered_${r.id}`, recipe: r })),
        ]
      : [
          { key: "recent_header" },
          ...(showAllRecent
            ? recentRecipes
            : recentRecipes.slice(0, PREVIEW_COUNT)
          ).map((r) => ({ key: `recent_${r.id}`, recipe: r })),
          { key: "popular_header" },
          ...(showAllPopular
            ? popularRecipes
            : popularRecipes.slice(0, PREVIEW_COUNT)
          ).map((r) => ({ key: `popular_${r.id}`, recipe: r })),
        ]),
  ];

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      data={listData}
      keyExtractor={(item) => item.key}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchData();
          }}
          tintColor={colors.primary}
        />
      }
      contentContainerStyle={{ paddingBottom: 100 }}
      renderItem={({ item }: any) => {
        if (item.key === "search")
          return (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.search}
                placeholder="Search recipes..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          );

        if (item.key === "create")
          return (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate("CreateRecipe")}
            >
              <Text style={styles.createButtonText}>+ Create Recipe</Text>
            </TouchableOpacity>
          );

        if (item.key === "pantry_header")
          return (
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>🛒 From Your Pantry</Text>
                <Text style={styles.sectionSubtitle}>
                  Recipes you can make with what you have
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate("Pantry")}
                style={styles.seeAllBtn}
              >
                <Text style={styles.seeAllText}>Manage</Text>
              </TouchableOpacity>
            </View>
          );

        if (item.key === "divider") return <View style={styles.divider} />;

        if (item.key === "search_header")
          return (
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Search Results</Text>
                <Text style={styles.sectionSubtitle}>
                  {filtered.length} recipe{filtered.length !== 1 ? "s" : ""}{" "}
                  found
                </Text>
              </View>
            </View>
          );

        if (item.key === "recent_header")
          return (
            <SectionHeader
              title="🕐 Recently Added"
              subtitle="The latest recipes"
              showAll={showAllRecent}
              onToggle={() => setShowAllRecent(!showAllRecent)}
              total={recentRecipes.length}
            />
          );

        if (item.key === "popular_header")
          return (
            <SectionHeader
              title="🔥 Most Popular"
              subtitle="Recipes loved by everyone"
              showAll={showAllPopular}
              onToggle={() => setShowAllPopular(!showAllPopular)}
              total={popularRecipes.length}
            />
          );

        if (item.recipe)
          return (
            <RecipeCard item={item.recipe} highlighted={item.highlighted} />
          );

        return null;
      }}
    />
  );
}

const styles = StyleSheet.create({
  searchContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  search: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  createButton: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  createButtonText: { color: colors.white, fontSize: 15, fontWeight: "600" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  sectionSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  seeAllBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  seeAllText: { fontSize: 12, color: colors.textSecondary },
  divider: { height: 8, backgroundColor: colors.background },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHighlighted: { borderWidth: 2, borderColor: colors.primary },
  matchBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  matchBadgeText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  cardImage: {
    width: "100%",
    height: 160,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: { fontSize: 48 },
  cardBody: { padding: 14 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  authorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  authorAvatarText: { fontSize: 9, fontWeight: "700", color: colors.primary },
  authorName: { fontSize: 12, color: colors.textMuted },
  cardMeta: { flexDirection: "row", gap: 12 },
  metaText: { fontSize: 13, color: colors.textFaint },
  matchText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "500",
    marginTop: 6,
  },
});
