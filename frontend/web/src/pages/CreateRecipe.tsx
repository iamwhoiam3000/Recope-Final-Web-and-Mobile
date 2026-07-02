import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import RecipeForm from "../pages/RecipeForm";

export default function CreateRecipe() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    setError("");

    const data = await api.post("/api/recipes", {
      title: formData.title,
      description: formData.description,
      prep_time: parseInt(formData.prepTime) || 0,
      cook_time: parseInt(formData.cookTime) || 0,
      servings: parseInt(formData.servings) || 1,
      image_url: formData.imageUrl,
      meal_type: Array.isArray(formData.mealType)
  ? formData.mealType[0] || ""
  : formData.mealType || "",
      cuisine_type: formData.cuisineType,
      cook_duration: formData.cookDuration,
      ingredients: formData.ingredients.filter((i: any) => i.name),
      steps: formData.steps.filter((s: any) => s.instruction),
    });

    if (data.error) {
      setError(data.error);
      setLoading(false);
      return;
    }

    navigate(`/recipe/${data.id}`);
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <button
        onClick={() => navigate("/")}
        style={{
          background: "none",
          border: "none",
          color: "#2d6a4f",
          fontSize: 14,
          marginBottom: 24,
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        ← Back
      </button>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
        Create Recipe
      </h2>
      <RecipeForm
        onSubmit={handleSubmit}
        submitLabel="Save Recipe"
        loading={loading}
        error={error}
      />
    </div>
  );
}
