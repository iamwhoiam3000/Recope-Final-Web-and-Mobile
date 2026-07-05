import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import RecipeForm from "../pages/RecipeForm";

export default function EditRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      const data = await api.get(`/api/recipes/${id}`);
      if (data.id) {
        setInitialData({
          title: data.title,
          description: data.description || "",
          prepTime: String(data.prep_time),
          cookTime: String(data.cook_time),
          servings: String(data.servings),
          imageUrl: data.image_url || "",
          mealType: Array.isArray(data.meal_type)
            ? data.meal_type
            : data.meal_type
              ? [data.meal_type]
              : [],
          cuisineType: data.cuisine_type || "",
          cookDuration: data.cook_duration || "",
          ingredients: data.ingredients || [],
          steps: data.steps || [],
        });
      }
      setFetching(false);
    };
    fetchRecipe();
  }, [id]);

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    setError("");

    const data = await api.put(`/api/recipes/${id}`, {
      title: formData.title,
      description: formData.description,
      prep_time: parseInt(formData.prepTime) || 0,
      cook_time: parseInt(formData.cookTime) || 0,
      servings: parseInt(formData.servings) || 1,
      image_url: formData.imageUrl,
      meal_type: Array.isArray(formData.mealType)
      ? formData.mealType
      : formData.mealType
      ? [formData.mealType]
      : [],
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

    navigate(`/recipe/${id}`);
  };

  if (fetching)
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <div style={{ color: "#999" }}>Loading...</div>
      </div>
    );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <button
        onClick={() => navigate(`/recipe/${id}`)}
        style={{
          background: "none",
          border: "none",
          color: "#999",
          fontSize: 14,
          marginBottom: 24,
          cursor: "pointer",
        }}
      >
        ← Back
      </button>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
        Edit Recipe
      </h2>
      <RecipeForm
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        loading={loading}
        error={error}
      />
    </div>
  );
}
