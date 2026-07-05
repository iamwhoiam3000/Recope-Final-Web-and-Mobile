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
  const [adjustedServings, setAdjustedServings] = useState<number>(1);
  const [nutrition, setNutrition] = useState<any>(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [substitutions, setSubstitutions] = useState<any[]>([]);
  const [substitutionsLoading, setSubstitutionsLoading] = useState(false);

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
        setAdjustedServings(data.servings || 1);
        setNutritionLoading(false);
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
    const data = await api.post(`/api/recipes/${id}/cook`, {});

    if (data.error) {
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

const handleGenerateNutrition = async () => {
  console.log("Generate Nutrition clicked");

  if (!recipe) {
    console.log("Recipe is null");
    return;
  }

  console.log("Recipe:", recipe);

  setNutritionLoading(true);

  try {
    const nutritionData = await api.post("/api/ai/nutrition", {
      title: recipe.title,
      servings: recipe.servings,
      ingredients,
    });

    console.log("Nutrition response:", nutritionData);

    if (nutritionData?.error) {
      alert(nutritionData.error || "Failed to generate nutrition.");
      return;
    }

    setNutrition(nutritionData);
  } catch (error) {
    console.error("Nutrition error:", error);
    alert("Failed to generate nutrition. Please try again.");
  } finally {
    setNutritionLoading(false);
  }
};

const handleGenerateSubstitutions = async () => {
  if (!recipe) return;

  setSubstitutionsLoading(true);

  try {
    const substitutionsData = await api.post("/api/ai/substitutions", {
      title: recipe.title,
      ingredients,
    });

    if (!substitutionsData.error) {
      setSubstitutions(substitutionsData.substitutions || []);
    } else {
      alert(substitutionsData.error);
    }
  } finally {
    setSubstitutionsLoading(false);
  }
};

  const getAuthorName = (profiles: Recipe["profiles"]) => {
    if (!profiles) return "Unknown";
    if (profiles.first_name)
      return `${profiles.first_name} ${profiles.last_name || ""}`.trim();
    return profiles.username || "Unknown";
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

      {/* META CARDS */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    marginTop: 20,
    marginBottom: 24,
  }}
>
  {[
    { label: "Prep", value: `${recipe.prep_time}min` },
    { label: "Cook", value: `${recipe.cook_time}min` },
    { label: "Serves", value: recipe.servings },
    { label: "Views", value: recipe.view_count || 0 },
  ].map((item) => (
    <div
      key={item.label}
      style={{
        backgroundColor: "#f0f7f4",
        border: "1px solid #d0e8dc",
        borderRadius: 12,
        padding: 14,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, color: "#2d6a4f" }}>
        {item.value}
      </div>
      <div style={{ fontSize: 13, color: "#777", marginTop: 4 }}>
        {item.label}
      </div>
    </div>
  ))}
</div>

      {/* NUTRITION */}

<div

  style={{

    marginTop: 24,

    marginBottom: 20,

    padding: 16,

    backgroundColor: "#fff7ed",

    borderRadius: 12,

    border: "1px solid #fed7aa",

  }}

>

  <h3 style={{ marginTop: 0 }}>Estimated Nutrition Per Serving</h3>



  <button

  onClick={handleGenerateNutrition}

  style={{

    marginBottom: 12,

    padding: "8px 14px",

    backgroundColor: "#2d6a4f",

    color: "#fff",

    border: "none",

    borderRadius: 8,

    cursor: "pointer",

  }}

>

  Generate Nutrition

</button>



  {nutritionLoading ? (

    <p>Calculating nutrition...</p>

  ) : nutrition ? (

    <div>

      <p>🔥 Calories: {nutrition.calories} kcal</p>

      <p>🥩 Protein: {nutrition.protein} g</p>

      <p>🥑 Fat: {nutrition.fat} g</p>

      <p>🍚 Carbohydrates: {nutrition.carbohydrates} g</p>

    </div>

  ) : (

    <p>No nutrition data available.</p>

  )}

</div>

<div
  style={{
    marginTop: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#f0f7ff",
    borderRadius: 12,
    border: "1px solid #bfdbfe",
  }}
>
  <h3 style={{ marginTop: 0 }}>💡 Alternative Ingredient Suggestions</h3>

  <button
  onClick={handleGenerateSubstitutions}
  disabled={substitutionsLoading}
  style={{
    marginBottom: 12,
    padding: "8px 14px",
    backgroundColor: "#2d6a4f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  }}
>
  {substitutionsLoading ? "Generating..." : "Generate Suggestions"}
</button>

  {substitutionsLoading ? (
    <p>Finding alternatives...</p>
  ) : substitutions.length > 0 ? (
    substitutions.map((item: any, index: number) => (
      <div key={index} style={{ marginBottom: 10 }}>
        <b>{item.ingredient}</b>
        <p style={{ margin: "4px 0", color: "#555" }}>
          Try: {item.alternatives?.join(", ")}
        </p>
      </div>
    ))
  ) : (
    <p>No substitution suggestions available.</p>
  )}
</div>

      {/* SERVING ADJUSTMENT */}
<div
  style={{
    marginTop: 24,
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#f0f7f4",
    borderRadius: 12,
    border: "1px solid #d0e8dc",
  }}
>
  <h3 style={{ marginTop: 0 }}>Serving Adjustment</h3>

  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <span>Original: {recipe.servings} serving(s)</span>

    <label>
      Adjust to:{" "}
      <input
        type="number"
        min="1"
        value={adjustedServings}
        onChange={(e) =>
          setAdjustedServings(Math.max(1, Number(e.target.value) || 1))
        }
        style={{
          width: 70,
          padding: 6,
          borderRadius: 6,
          border: "1px solid #ccc",
        }}
      />{" "}
      serving(s)
    </label>
  </div>
</div>

      {/* INGREDIENTS */}
      <h3>Ingredients</h3>
      {ingredients.map((ing) => (
        <div key={ing.id}>
          {getAdjustedAmount(ing.amount)} {ing.unit} {ing.name}
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
