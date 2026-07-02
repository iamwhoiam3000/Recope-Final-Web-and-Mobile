import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import ReviewSection from "../pages/ReviewSection";

interface Recipe {
  id: string;
  title: string;
  description: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  user_id: string;
  image_url: string;
  meal_type: string[];
  cuisine_type: string;
  cook_duration: string;
  view_count: number;
  profiles: {
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

interface Step {
  id: string;
  step_number: number;
  instruction: string;
}

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const hasTrackedView = useRef(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (hasTrackedView.current) return;
      hasTrackedView.current = true;

      const favs = await api.get("/api/favorites");
      if (Array.isArray(favs)) {
        setIsFavorite(favs.some((f: any) => f.recipe_id === id));
      }

      const data = await api.get(`/api/recipes/${id}`);

      if (data.id) {
        setRecipe(data);
        setIngredients(data.ingredients || []);
        setSteps(data.steps || []);
      }

      setLoading(false);
    };

    fetchRecipe();
  }, [id]);


  const handleToggleFavorite = async () => {
  setFavoriteLoading(true);

  if (isFavorite) {
    const data = await api.delete(`/api/favorites/${id}`);
    if (!data.error) setIsFavorite(false);
  } else {
    const data = await api.post("/api/favorites", { recipe_id: id });
    if (!data.error) setIsFavorite(true);
  }

  setFavoriteLoading(false);
};
  
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return;
    setDeleting(true);
    await api.delete(`/api/recipes/${id}`);
    navigate("/");
  };

  // ============================
  // 🍳 COOK RECIPE FUNCTION
  // ============================
const handleCookRecipe = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch(
      `http://localhost:4000/api/recipes/${id}/cook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to cook recipe");
      return;
    }

    const deductionText =
  data.deductions?.length > 0
    ? data.deductions
        .map((item: any) =>
          item.removed
            ? `• ${item.name}: ${item.before} ${item.unit || ""} → removed from pantry`
            : `• ${item.name}: ${item.before} → ${item.after} ${item.unit || ""}`
        )
        .join("\n")
    : "";

alert(
  `✅ ${data.message || "Recipe cooked successfully!"}${
    deductionText ? `\n\nPantry updated:\n${deductionText}` : ""
  }`
);

navigate("/pantry");
  } catch (err) {
    console.error(err);
    alert("Something went wrong while cooking recipe");
  }
};

  const getAuthorName = (profiles: Recipe["profiles"]) => {
    if (!profiles) return "Unknown";
    if (profiles.first_name)
      return `${profiles.first_name} ${profiles.last_name || ""}`.trim();
    return profiles.username || "Unknown";
  };

  if (loading)
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <div style={{ color: "#999" }}>Loading...</div>
      </div>
    );

  if (!recipe) return <p>Recipe not found.</p>;

  const isOwner = user?.id === recipe.user_id;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      
      <button onClick={handleToggleFavorite} disabled={favoriteLoading}>
  {isFavorite ? "❤️ Favorited" : "🤍 Add to Favorites"}
  </button>

      <button
        onClick={() => navigate("/")}
        style={{
          background: "none",
          border: "none",
          color: "#999",
          fontSize: 14,
          marginBottom: 24,
          cursor: "pointer",
        }}
      >
        ← Back to recipes
      </button>

      {/* IMAGE */}
      <div
        style={{
          width: "100%",
          height: 280,
          backgroundColor: "#eaf4ef",
          borderRadius: 16,
          marginBottom: 28,
          overflow: "hidden",
        }}
      >
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ fontSize: 80, textAlign: "center" }}>🍽️</div>
        )}
      </div>

      {/* TITLE + ACTIONS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <h2 style={{ fontSize: 32 }}>{recipe.title}</h2>

        <div style={{ display: "flex", gap: 8 }}>
          {isOwner && (
            <>
              <button onClick={() => navigate(`/edit/${recipe.id}`)}>
                Edit
              </button>

              <button onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </>
          )}

          {/* 🍳 COOK BUTTON */}
          <button
            onClick={handleCookRecipe}
            style={{
              backgroundColor: "#2d6a4f",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Cook Recipe 🍳
          </button>
        </div>
      </div>

      {/* DESCRIPTION */}
      <p style={{ color: "#666", marginTop: 10 }}>{recipe.description}</p>

      {/* INGREDIENTS */}
      <h3>Ingredients</h3>
      {ingredients.map((ing) => (
        <div key={ing.id}>
          {ing.amount} {ing.unit} {ing.name}
        </div>
      ))}

      {/* STEPS */}
      <h3>Steps</h3>
      {steps.map((step, i) => (
        <div key={step.id}>
          <b>{i + 1}.</b> {step.instruction}
        </div>
      ))}

      <ReviewSection recipeId={id!} />
    </div>
  );
}
