import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
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
  const hasTrackedView = useRef(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (hasTrackedView.current) return;
      hasTrackedView.current = true;

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

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return;
    setDeleting(true);
    await api.delete(`/api/recipes/${id}`);
    navigate("/");
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
      <button
        onClick={() => navigate("/")}
        style={{
          background: "none",
          border: "none",
          color: "#999",
          fontSize: 14,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 4,
          cursor: "pointer",
        }}
      >
        ← Back to recipes
      </button>

      {/* Hero image */}
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
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 80,
            }}
          >
            🍽️
          </div>
        )}
      </div>

      {/* Title + actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <h2
          style={{
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1.2,
            flex: 1,
            marginRight: 16,
          }}
        >
          {recipe.title}
        </h2>
        {isOwner && (
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => navigate(`/edit/${recipe.id}`)}
              style={{
                border: "1px solid #eee",
                background: "#fff",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                border: "1px solid #ffcdd2",
                background: "#fff5f5",
                color: "#e53935",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </div>

      {/* Author + categories */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "#eaf4ef",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              fontWeight: 700,
              color: "#2d6a4f",
              border: "2px solid #95c9b0",
              flexShrink: 0,
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
          <div>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                margin: 0,
                color: "#1a1a1a",
              }}
            >
              {getAuthorName(recipe.profiles)}
            </p>
            <p style={{ fontSize: 12, color: "#999", margin: 0 }}>
              Recipe author
            </p>
          </div>
        </div>

        {/* Category badges */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {recipe.meal_type?.map((type: string) => (
            <span
              key={type}
              style={{
                fontSize: 12,
                padding: "3px 10px",
                borderRadius: 20,
                backgroundColor: "#eaf4ef",
                color: "#2d6a4f",
                fontWeight: 600,
              }}
            >
              {type}
            </span>
          ))}
          {recipe.cuisine_type && (
            <span
              style={{
                fontSize: 12,
                padding: "3px 10px",
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
                fontSize: 12,
                padding: "3px 10px",
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
      </div>

      <p
        style={{
          color: "#666",
          fontSize: 16,
          marginBottom: 24,
          lineHeight: 1.6,
        }}
      >
        {recipe.description}
      </p>

      {/* Meta cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 36 }}>
        {[
          { label: "Prep time", value: `${recipe.prep_time} min` },
          { label: "Cook time", value: `${recipe.cook_time} min` },
          { label: "Servings", value: recipe.servings },
          { label: "Views", value: recipe.view_count || 0 },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              backgroundColor: "#fff",
              border: "1px solid #eee",
              borderRadius: 10,
              padding: "14px 16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: "#2d6a4f" }}>
              {item.value}
            </div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Ingredients */}
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          Ingredients
        </h3>
        {ingredients.map((ing) => (
          <div
            key={ing.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 0",
              borderBottom: "1px solid #f5f5f5",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#2d6a4f",
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#666", fontSize: 15 }}>
              {ing.amount} {ing.unit}
            </span>
            <span style={{ fontSize: 15, fontWeight: 500 }}>{ing.name}</span>
          </div>
        ))}
      </div>

      {/* Steps */}
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          Steps
        </h3>
        {steps.map((step, index) => (
          <div
            key={step.id}
            style={{ display: "flex", gap: 16, marginBottom: 20 }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#2d6a4f",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {index + 1}
            </div>
            <p
              style={{
                fontSize: 15,
                color: "#444",
                lineHeight: 1.7,
                paddingTop: 4,
              }}
            >
              {step.instruction}
            </p>
          </div>
        ))}
        <ReviewSection recipeId={id!} />
      </div>
    </div>
  );
}
