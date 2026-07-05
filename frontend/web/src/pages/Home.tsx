import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import RecipeChat from "../pages/RecipeChat";

interface Recipe {
  id: string;
  title: string;
  description: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  image_url: string;
  meal_type: string | string[];
  cuisine_type: string;
  cook_duration: string;
  view_count: number;
  created_at: string;
  avg_rating: number;
  review_count: number;
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

const MEAL_TYPES = [
  "All",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks",
  "Desserts",
];
const CUISINE_TYPES = [
  "All",
  "Beef",
  "Chicken",
  "Pork",
  "Seafood",
  "Vegetarian",
];
const COOK_DURATIONS = [
  "All",
  "Quick (under 30min)",
  "Medium (30-60min)",
  "Long (over 60min)",
];
const PREVIEW_COUNT = 4;

const GREEN = {
  primary: "#2d6a4f",
  light: "#f0f7f4",
  mid: "#d0e8dc",
  badge: "#d8f3dc",
  badgeText: "#1b4332",
  hover: "rgba(45,106,79,0.12)",
};

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;
  const [matched, setMatched] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mealFilter, setMealFilter] = useState("All");
  const [cuisineFilter, setCuisineFilter] = useState("All");
  const [durationFilter, setDurationFilter] = useState("All");
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [showAllPopular, setShowAllPopular] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    const [recipesData, matchedData, favoritesData] = await Promise.all([
  api.get(`/api/recipes?page=${page}&limit=${LIMIT}`),
  api.get("/api/pantry/match"),
  api.get("/api/favorites"),
]);
if (Array.isArray(favoritesData)) {
  setFavorites(favoritesData.map((f: any) => f.recipes).filter(Boolean));
}
    if (recipesData?.data) {
  if (page === 1) {
    setRecipes(recipesData.data);
  } else {
    setRecipes((prev) => [...prev, ...recipesData.data]);
  }

  setLoadingMore(false);

  setHasMore(recipesData.hasMore);
}
    if (Array.isArray(matchedData)) setMatched(matchedData);
    setLoading(false);
  }, []);

useEffect(() => {
  fetchData();
}, [page]);

  useEffect(() => {
  const handleFocus = () => fetchData();
  const handleRecipesUpdated = () => fetchData();

  window.addEventListener("focus", handleFocus);
  window.addEventListener("recipes-updated", handleRecipesUpdated);

  return () => {
    window.removeEventListener("focus", handleFocus);
    window.removeEventListener("recipes-updated", handleRecipesUpdated);
  };
}, [fetchData]);

useEffect(() => {
  const handleScroll = () => {
    if (loading || loadingMore || !hasMore) return;

    const nearBottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 300;

    if (nearBottom) {
      setLoadingMore(true);
      setPage((prev) => prev + 1);
    }
  };

  window.addEventListener("scroll", handleScroll);

  return () => window.removeEventListener("scroll", handleScroll);
}, [loading, loadingMore, hasMore]);

  const isFiltering =
    search ||
    mealFilter !== "All" ||
    cuisineFilter !== "All" ||
    durationFilter !== "All";

    const getMealTypes = (mealType: string | string[] | null | undefined) => {
  if (Array.isArray(mealType)) return mealType;
  if (typeof mealType === "string" && mealType.trim()) return [mealType];
  return [];
};

  const filtered = recipes.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesMeal =
      mealFilter === "All" || getMealTypes(r.meal_type).includes(mealFilter);
    const matchesCuisine =
      cuisineFilter === "All" || r.cuisine_type === cuisineFilter;
    const matchesDuration =
      durationFilter === "All" || r.cook_duration === durationFilter;
    return matchesSearch && matchesMeal && matchesCuisine && matchesDuration;
  });

  const recentRecipes = [...recipes].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const popularRecipes = [...recipes].sort(
    (a, b) => b.view_count - a.view_count,
  );

  const getAuthorName = (profiles: Recipe["profiles"]) => {
    if (!profiles) return "Unknown";
    if (profiles.first_name)
      return `${profiles.first_name} ${profiles.last_name || ""}`.trim();
    return profiles.username || "Unknown";
  };

  const filterSelectStyle = (active: boolean): React.CSSProperties => ({
    padding: "12px 32px 12px 14px",
    borderRadius: 10,
    border: `1px solid ${active ? GREEN.primary : "#eee"}`,
    backgroundColor: active ? GREEN.light : "#fff",
    color: active ? GREEN.primary : "#666",
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    outline: "none",
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232d6a4f' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
  });

  const RecipeCard = ({
    recipe,
    highlighted = false,
  }: {
    recipe: Recipe;
    highlighted?: boolean;
  }) => (
    <div
      onClick={() => navigate(`/recipe/${recipe.id}`)}
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        cursor: "pointer",
        border: highlighted ? `2px solid ${GREEN.primary}` : "1px solid #eee",
        position: "relative",
        transition: "transform 0.1s, box-shadow 0.1s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform =
          "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = highlighted
          ? `0 4px 20px ${GREEN.hover}`
          : "0 4px 20px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {highlighted && recipe.matchPercent !== undefined && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            backgroundColor: GREEN.primary,
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 20,
          }}
        >
          {recipe.matchPercent}% match
        </div>
      )}

      {/* Category badges */}
      {(recipe.meal_type || recipe.cuisine_type || recipe.cook_duration) && (
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          {getMealTypes(recipe.meal_type).map((type: string) => (
            <span
              key={type}
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 20,
                backgroundColor: GREEN.light,
                color: GREEN.primary,
                fontWeight: 600,
              }}
            >
              {type}
            </span>
          ))}
          {recipe.cuisine_type && (
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 20,
                backgroundColor: "#f0f0f0",
                color: "#666",
                fontWeight: 600,
              }}
            >
              {recipe.cuisine_type}
            </span>
          )}
          {recipe.cook_duration && (
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 20,
                backgroundColor: "#f0f7ff",
                color: "#1976d2",
                fontWeight: 600,
              }}
            >
              {recipe.cook_duration}
            </span>
          )}
        </div>
      )}

      {/* Image */}
      <div
        style={{
          width: "100%",
          height: 140,
          backgroundColor: GREEN.light,
          borderRadius: 8,
          marginBottom: 14,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 48,
        }}
      >
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          "🍽️"
        )}
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>
        {recipe.title}
      </h3>

      <div style={{ color: "#f59e0b", fontSize: 14, marginBottom: 8 }}>
        ★ {Number(recipe.avg_rating || 0).toFixed(1)} ({recipe.review_count || 0})
        </div>

      {/* Rating */}
      {recipe.avg_rating > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
          }}
        >
          <span style={{ color: "#f59e0b", fontSize: 14 }}>
            {"★".repeat(Math.round(recipe.avg_rating))}
            {"☆".repeat(5 - Math.round(recipe.avg_rating))}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>
            {Number(recipe.avg_rating).toFixed(1)}
          </span>
          <span style={{ fontSize: 12, color: "#999" }}>
            ({recipe.review_count})
          </span>
        </div>
      )}

      {/* Description */}
      <p
        style={{
          color: "#999",
          fontSize: 14,
          marginBottom: 12,
          lineHeight: 1.5,
        }}
      >
        {recipe.description?.slice(0, 80)}
        {recipe.description?.length > 80 ? "..." : ""}
      </p>

      {/* Author */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: GREEN.light,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color: GREEN.primary,
            flexShrink: 0,
            border: `1px solid ${GREEN.mid}`,
          }}
        >
          {recipe.profiles?.avatar_url ? (
            <img
              src={recipe.profiles.avatar_url}
              alt="avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            getAuthorName(recipe.profiles).charAt(0).toUpperCase()
          )}
        </div>
        <span style={{ fontSize: 12, color: "#999" }}>
          by{" "}
          <span style={{ fontWeight: 600, color: "#666" }}>
            {getAuthorName(recipe.profiles)}
          </span>
        </span>
      </div>

      {/* Meta */}
      <div
        style={{
          display: "flex",
          gap: 12,
          fontSize: 13,
          color: "#bbb",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <span>⏱ {recipe.prep_time + recipe.cook_time}min</span>
          <span>👤 {recipe.servings} servings</span>
        </div>
        {recipe.view_count > 0 && <span>👁 {recipe.view_count}</span>}
      </div>

      {highlighted && recipe.matchedCount !== undefined && (
        <p
          style={{
            fontSize: 13,
            color: GREEN.primary,
            fontWeight: 500,
            marginTop: 8,
          }}
        >
          {recipe.matchedCount} of {recipe.totalCount} ingredients available
        </p>
      )}
    </div>
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
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
      }}
    >
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
          {title}
        </h2>
        <p style={{ color: "#999", fontSize: 13 }}>{subtitle}</p>
      </div>
      {total > PREVIEW_COUNT && (
        <button
          onClick={onToggle}
          style={{
            background: "none",
            border: `1px solid ${GREEN.mid}`,
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 13,
            color: GREEN.primary,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          {showAll ? "Show Less ↑" : `See All (${total}) →`}
        </button>
      )}
    </div>
  );

  if (loading)
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <div style={{ color: "#999" }}>Loading recipes...</div>
      </div>
    );

  return (
    <div>

      {/* Pantry Matches */}
      {matched.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
                🛒 From Your Pantry
              </h2>
              <p style={{ color: "#999", fontSize: 13 }}>
                Recipes you can make with ingredients you have
              </p>
            </div>
            <button
              onClick={() => navigate("/pantry")}
              style={{
                background: "none",
                border: `1px solid ${GREEN.mid}`,
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 13,
                color: GREEN.primary,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Manage Pantry
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {matched.slice(0, 3).map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} highlighted />
            ))}
          </div>
        </div>
      )}

      {/* Search + Filter bar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 32,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 16,
              color: "#999",
            }}
          >
            🔍
          </span>
          <input
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 40px",
              borderRadius: 10,
              border: "1px solid #eee",
              fontSize: 15,
              backgroundColor: "#fff",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <select
          value={mealFilter}
          onChange={(e) => setMealFilter(e.target.value)}
          style={filterSelectStyle(mealFilter !== "All")}
        >
          {MEAL_TYPES.map((type) => (
            <option key={type} value={type}>
              {type === "All" ? "Meal Type" : type}
            </option>
          ))}
        </select>

        <select
          value={cuisineFilter}
          onChange={(e) => setCuisineFilter(e.target.value)}
          style={filterSelectStyle(cuisineFilter !== "All")}
        >
          {CUISINE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type === "All" ? "Cuisine" : type}
            </option>
          ))}
        </select>

        <select
          value={durationFilter}
          onChange={(e) => setDurationFilter(e.target.value)}
          style={filterSelectStyle(durationFilter !== "All")}
        >
          {COOK_DURATIONS.map((type) => (
            <option key={type} value={type}>
              {type === "All" ? "Duration" : type}
            </option>
          ))}
        </select>

        {(mealFilter !== "All" ||
          cuisineFilter !== "All" ||
          durationFilter !== "All" ||
          search) && (
          <button
            onClick={() => {
              setMealFilter("All");
              setCuisineFilter("All");
              setDurationFilter("All");
              setSearch("");
            }}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #ffcdd2",
              backgroundColor: "#fff5f5",
              color: "#e53935",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Clear ✕
          </button>
        )}
      </div>

      {/* Filtered results */}
      {isFiltering ? (
        <div>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
              Search Results
            </h2>
            <p style={{ color: "#999", fontSize: 13 }}>
              {filtered.length} recipe{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 80, color: "#999" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 18, marginBottom: 8 }}>No recipes found</p>
              <p style={{ fontSize: 14 }}>Try a different search or filter</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 20,
              }}
            >
              {filtered.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>

                {favorites.length > 0 && (
  <section style={{ marginBottom: 32 }}>
    <h3>❤️ My Favorites</h3>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
      {favorites.slice(0, 4).map((recipe: any) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  </section>
)}

          {/* Recent Recipes */}
          <div style={{ marginBottom: 40 }}>
            <SectionHeader
              title="🕐 Recently Added"
              subtitle="The latest recipes from the community"
              showAll={showAllRecent}
              onToggle={() => setShowAllRecent(!showAllRecent)}
              total={recentRecipes.length}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 20,
              }}
            >
              {(showAllRecent
                ? recentRecipes
                : recentRecipes.slice(0, PREVIEW_COUNT)
              ).map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </div>

          {/* Popular Recipes */}
          <div style={{ marginBottom: 40 }}>
            <SectionHeader
              title="🔥 Most Popular"
              subtitle="Recipes loved by the community"
              showAll={showAllPopular}
              onToggle={() => setShowAllPopular(!showAllPopular)}
              total={popularRecipes.length}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 20,
              }}
            >
              {(showAllPopular
                ? popularRecipes
                : popularRecipes.slice(0, PREVIEW_COUNT)
              ).map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </div>
        </div>
      )}

      {loadingMore && (
        <p style={{ textAlign: "center", color: "#999", marginTop: 20 }}>
          Loading more recipes...
        </p>
      )}

      <RecipeChat />
    </div>
  );
}