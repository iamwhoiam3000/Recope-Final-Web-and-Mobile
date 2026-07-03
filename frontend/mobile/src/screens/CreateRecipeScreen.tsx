import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../lib/api";
import { colors } from "../theme";
import ImageUpload from "../components/ImageUpload";

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}
interface Step {
  instruction: string;
}

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snacks", "Desserts"];
const CUISINE_TYPES = ["Beef", "Chicken", "Pork", "Seafood", "Vegetarian"];
const COOK_DURATIONS = [
  "Quick (under 30min)",
  "Medium (30-60min)",
  "Long (over 60min)",
];

export default function CreateRecipeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editId = route.params?.editId || null;
  const isEditing = !!editId;

  const [fetching, setFetching] = useState(isEditing);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [mealType, setMealType] = useState<string[]>([]);
  const [cuisineType, setCuisineType] = useState("");
  const [cookDuration, setCookDuration] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", amount: "", unit: "" },
  ]);
  const [steps, setSteps] = useState<Step[]>([{ instruction: "" }]);

  useEffect(() => {
    if (!isEditing) return;
    const fetchRecipe = async () => {
      const data = await api.get(`/api/recipes/${editId}`);
      if (data.id) {
        setTitle(data.title);
        setDescription(data.description || "");
        setPrepTime(String(data.prep_time));
        setCookTime(String(data.cook_time));
        setServings(String(data.servings));
        setImageUrl(data.image_url || "");
        setMealType(
          Array.isArray(data.meal_type)
            ? data.meal_type
            : data.meal_type
              ? [data.meal_type]
              : [],
        );
        setCuisineType(data.cuisine_type || "");
        setCookDuration(data.cook_duration || "");
        setIngredients(
          data.ingredients?.length
            ? data.ingredients
            : [{ name: "", amount: "", unit: "" }],
        );
        setSteps(data.steps?.length ? data.steps : [{ instruction: "" }]);
      }
      setFetching(false);
    };
    fetchRecipe();
  }, [editId]);

  const toggleMealType = (type: string) => {
    setMealType((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const addIngredient = () =>
    setIngredients([...ingredients, { name: "", amount: "", unit: "" }]);
  const addStep = () => setSteps([...steps, { instruction: "" }]);

  const updateIngredient = (
    i: number,
    field: keyof Ingredient,
    value: string,
  ) => {
    const updated = [...ingredients];
    updated[i] = { ...updated[i], [field]: value };
    setIngredients(updated);
  };

  const updateStep = (i: number, value: string) => {
    const updated = [...steps];
    updated[i].instruction = value;
    setSteps(updated);
  };

  const removeIngredient = (i: number) =>
    setIngredients(ingredients.filter((_, idx) => idx !== i));
  const removeStep = (i: number) =>
    setSteps(steps.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!title) return Alert.alert("Error", "Please enter a title");
    setLoading(true);

    const payload = {
      title,
      description,
      prep_time: parseInt(prepTime) || 0,
      cook_time: parseInt(cookTime) || 0,
      servings: parseInt(servings) || 1,
      image_url: imageUrl,
      meal_type: mealType,
      cuisine_type: cuisineType,
      cook_duration: cookDuration,
      ingredients: ingredients.filter((i) => i.name),
      steps: steps.filter((s) => s.instruction),
    };

    const data = isEditing
      ? await api.put(`/api/recipes/${editId}`, payload)
      : await api.post("/api/recipes", payload);

    if (data.error) {
      Alert.alert("Error", data.error);
      setLoading(false);
      return;
    }

    if (isEditing) {
  navigation.navigate("Main", { screen: "Home" });
} else {
  navigation.navigate("RecipeDetail", { id: data.id });
}
  };

  if (fetching)
    return (
      <ActivityIndicator
        style={{ flex: 1 }}
        size="large"
        color={colors.primary}
      />
    );

  const chipStyle = (active: boolean) => ({
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: active ? colors.primary : colors.border,
    backgroundColor: active ? colors.primaryLight : colors.white,
    marginRight: 8,
    marginBottom: 8,
  });

  const chipTextStyle = (active: boolean) => ({
    fontSize: 13,
    color: active ? colors.primary : colors.textSecondary,
    fontWeight: active ? ("600" as const) : ("400" as const),
  });

  return (
    <KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
>
  <ScrollView
    style={styles.container}
    contentContainerStyle={{ paddingBottom: 120 }}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
  >
        {/* Basic info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <ImageUpload currentImage={imageUrl} onUpload={setImageUrl} />
          <Text style={styles.label}>Recipe Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Creamy Pasta Carbonara"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Brief description..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Prep (min)</Text>
              <TextInput
                style={styles.input}
                placeholder="15"
                placeholderTextColor={colors.textMuted}
                value={prepTime}
                onChangeText={setPrepTime}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Cook (min)</Text>
              <TextInput
                style={styles.input}
                placeholder="30"
                placeholderTextColor={colors.textMuted}
                value={cookTime}
                onChangeText={setCookTime}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Servings</Text>
              <TextInput
                style={styles.input}
                placeholder="4"
                placeholderTextColor={colors.textMuted}
                value={servings}
                onChangeText={setServings}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Meal Type - multi select */}
          <Text style={styles.label}>
            Meal Type{" "}
            <Text
              style={{
                fontSize: 11,
                color: colors.textMuted,
                fontWeight: "400",
              }}
            >
              (select all that apply)
            </Text>
          </Text>
          <View style={styles.chips}>
            {MEAL_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => toggleMealType(type)}
                style={chipStyle(mealType.includes(type))}
              >
                <Text style={chipTextStyle(mealType.includes(type))}>
                  {mealType.includes(type) ? "✓ " : ""}
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cuisine Type - single select */}
          <Text style={styles.label}>Cuisine Type</Text>
          <View style={styles.chips}>
            {CUISINE_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setCuisineType(cuisineType === type ? "" : type)}
                style={chipStyle(cuisineType === type)}
              >
                <Text style={chipTextStyle(cuisineType === type)}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cook Duration - single select */}
          <Text style={styles.label}>Cook Duration</Text>
          <View style={styles.chips}>
            {COOK_DURATIONS.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() =>
                  setCookDuration(cookDuration === type ? "" : type)
                }
                style={chipStyle(cookDuration === type)}
              >
                <Text style={chipTextStyle(cookDuration === type)}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <TextInput
                style={[styles.input, { width: 64 }]}
                placeholder="Amt"
                placeholderTextColor={colors.textMuted}
                value={ing.amount}
                onChangeText={(v) => updateIngredient(i, "amount", v)}
              />
              <TextInput
                style={[styles.input, { width: 64 }]}
                placeholder="Unit"
                placeholderTextColor={colors.textMuted}
                value={ing.unit}
                onChangeText={(v) => updateIngredient(i, "unit", v)}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Name"
                placeholderTextColor={colors.textMuted}
                value={ing.name}
                onChangeText={(v) => updateIngredient(i, "name", v)}
              />
              <TouchableOpacity
                onPress={() => removeIngredient(i)}
                style={styles.removeBtn}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addBtn} onPress={addIngredient}>
            <Text style={styles.addBtnText}>+ Add Ingredient</Text>
          </TouchableOpacity>
        </View>

        {/* Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Steps</Text>
          {steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textarea, { flex: 1 }]}
                placeholder={`Step ${i + 1}...`}
                placeholderTextColor={colors.textMuted}
                value={step.instruction}
                onChangeText={(v) => updateStep(i, v)}
                multiline
              />
              <TouchableOpacity
                onPress={() => removeStep(i)}
                style={styles.removeBtn}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addBtn} onPress={addStep}>
            <Text style={styles.addBtnText}>+ Add Step</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>
              {isEditing ? "Save Changes" : "Save Recipe"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    backgroundColor: colors.background,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  textarea: { height: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  ingredientRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  stepRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  stepNumberText: { color: colors.white, fontSize: 13, fontWeight: "700" },
  removeBtn: { padding: 10, marginTop: 2 },
  removeBtnText: { color: colors.textFaint, fontSize: 16 },
  addBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginTop: 4,
  },
  addBtnText: { color: colors.textMuted, fontSize: 14 },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    margin: 16,
  },
  submitBtnText: { color: colors.white, fontSize: 16, fontWeight: "600" },
});
