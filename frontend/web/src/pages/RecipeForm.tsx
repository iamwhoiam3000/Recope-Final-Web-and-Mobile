import { useState } from "react";
import ImageUpload from "./RecipeImageUpload";

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface Step {
  instruction: string;
}

interface RecipeFormData {
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  imageUrl: string;
  mealType: string[];
  cuisineType: string;
  cookDuration: string;
  ingredients: Ingredient[];
  steps: Step[];
}

interface Props {
  initialData?: Partial<RecipeFormData>;
  onSubmit: (data: RecipeFormData) => Promise<void>;
  submitLabel: string;
  loading: boolean;
  error: string;
}

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snacks", "Desserts"];
const CUISINE_TYPES = ["Beef", "Chicken", "Pork", "Seafood", "Vegetarian"];
const COOK_DURATIONS = [
  "Quick (under 30min)",
  "Medium (30-60min)",
  "Long (over 60min)",
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  border: "1px solid #eee",
  fontSize: 15,
  outline: "none",
  backgroundColor: "#f4faf7",
  marginBottom: 0,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 600,
  color: "#444",
  marginBottom: 6,
};

const sectionStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  border: "1px solid #eee",
  borderRadius: 12,
  padding: 24,
  marginBottom: 20,
};

export default function RecipeForm({
  initialData,
  onSubmit,
  submitLabel,
  loading,
  error,
}: Props) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [prepTime, setPrepTime] = useState(initialData?.prepTime || "");
  const [cookTime, setCookTime] = useState(initialData?.cookTime || "");
  const [servings, setServings] = useState(initialData?.servings || "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [mealType, setMealType] = useState<string[]>(
    initialData?.mealType || [],
  );
  const [cuisineType, setCuisineType] = useState(
    initialData?.cuisineType || "",
  );
  const [cookDuration, setCookDuration] = useState(
    initialData?.cookDuration || "",
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialData?.ingredients || [{ name: "", amount: "", unit: "" }],
  );
  const [steps, setSteps] = useState<Step[]>(
    initialData?.steps || [{ instruction: "" }],
  );

  const toggleMealType = (type: string) => {
    setMealType((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const addIngredient = () =>
    setIngredients([...ingredients, { name: "", amount: "", unit: "" }]);
  const addStep = () => setSteps([...steps, { instruction: "" }]);

  const updateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: string,
  ) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index].instruction = value;
    setSteps(updated);
  };

  const removeIngredient = (index: number) =>
    setIngredients(ingredients.filter((_, i) => i !== index));
  const removeStep = (index: number) =>
    setSteps(steps.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      title,
      description,
      prepTime,
      cookTime,
      servings,
      imageUrl,
      mealType,
      cuisineType,
      cookDuration,
      ingredients,
      steps,
    });
  };

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: "7px 14px",
    borderRadius: 20,
    border: `1px solid ${active ? "#2d6a4f" : "#eee"}`,
    backgroundColor: active ? "#eaf4ef" : "#fff",
    color: active ? "#2d6a4f" : "#666",
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
  });

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div
          style={{
            backgroundColor: "#fff5f5",
            border: "1px solid #ffcdd2",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 20,
            color: "#e53935",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div style={sectionStyle}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
          Basic Info
        </h3>
        <ImageUpload currentImage={imageUrl} onUpload={setImageUrl} />
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Recipe Title *</label>
          <input
            placeholder="e.g. Creamy Pasta Carbonara"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            placeholder="Brief description of the recipe..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ ...inputStyle, height: 90, resize: "vertical" }}
          />
        </div>
      </div>

      {/* Details */}
      <div style={sectionStyle}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
          Details
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <label style={labelStyle}>Prep Time (min)</label>
            <input
              type="number"
              placeholder="15"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Cook Time (min)</label>
            <input
              type="number"
              placeholder="30"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Servings</label>
            <input
              type="number"
              placeholder="4"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Meal Type - multi select */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>
            Meal Type
            <span
              style={{
                fontSize: 12,
                color: "#999",
                fontWeight: 400,
                marginLeft: 8,
              }}
            >
              (select all that apply)
            </span>
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleMealType(type)}
                style={chipStyle(mealType.includes(type))}
              >
                {mealType.includes(type) ? "✓ " : ""}
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Cuisine Type - single select */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Cuisine Type</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CUISINE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setCuisineType(cuisineType === type ? "" : type)}
                style={chipStyle(cuisineType === type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Cook Duration - single select */}
        <div>
          <label style={labelStyle}>Cook Duration</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {COOK_DURATIONS.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  setCookDuration(cookDuration === type ? "" : type)
                }
                style={chipStyle(cookDuration === type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div style={sectionStyle}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
          Ingredients
        </h3>
        {ingredients.map((ing, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "100px 100px 1fr 36px",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <input
              placeholder="Amount"
              value={ing.amount}
              onChange={(e) => updateIngredient(i, "amount", e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Unit"
              value={ing.unit}
              onChange={(e) => updateIngredient(i, "unit", e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Ingredient name"
              value={ing.name}
              onChange={(e) => updateIngredient(i, "name", e.target.value)}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => removeIngredient(i)}
              style={{
                background: "none",
                border: "1px solid #eee",
                borderRadius: 8,
                color: "#ccc",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addIngredient}
          style={{
            background: "none",
            border: "1px dashed #ddd",
            borderRadius: 8,
            padding: "8px 16px",
            color: "#999",
            fontSize: 14,
            width: "100%",
            marginTop: 4,
            cursor: "pointer",
          }}
        >
          + Add Ingredient
        </button>
      </div>

      {/* Steps */}
      <div style={sectionStyle}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
          Steps
        </h3>
        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 12,
              alignItems: "flex-start",
            }}
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
                marginTop: 4,
              }}
            >
              {i + 1}
            </div>
            <textarea
              placeholder={`Describe step ${i + 1}...`}
              value={step.instruction}
              onChange={(e) => updateStep(i, e.target.value)}
              style={{ ...inputStyle, flex: 1, height: 80, resize: "vertical" }}
            />
            <button
              type="button"
              onClick={() => removeStep(i)}
              style={{
                background: "none",
                border: "1px solid #eee",
                borderRadius: 8,
                color: "#ccc",
                fontSize: 16,
                padding: "6px 10px",
                marginTop: 4,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addStep}
          style={{
            background: "none",
            border: "1px dashed #ddd",
            borderRadius: 8,
            padding: "8px 16px",
            color: "#999",
            fontSize: 14,
            width: "100%",
            marginTop: 4,
            cursor: "pointer",
          }}
        >
          + Add Step
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          backgroundColor: loading ? "#95c9b0" : "#2d6a4f",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 40,
          cursor: "pointer",
        }}
      >
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
