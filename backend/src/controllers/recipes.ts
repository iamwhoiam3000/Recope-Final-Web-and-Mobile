import { Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';
import { generatePollinationsImageUrl } from "../lib/generatePollinationsImage";

const normalizeIngredientName = (name: any): string => {
  let normalized = String(name || "")
    .toLowerCase()
    .trim();

  normalized = normalized.replace(/[^a-z0-9\s]/g, "");
  normalized = normalized.replace(/\s+/g, " ");

  const replacements: Record<string, string> = {
    tomatoes: "tomato",
    potatoes: "potato",
    leaves: "leaf",
    loaves: "loaf",
    knives: "knife",
    eggs: "egg",
    onions: "onion",
    carrots: "carrot",
    bananas: "banana",
    apples: "apple",
    cups: "cup",
    tablespoons: "tablespoon",
    tbsp: "tablespoon",
    teaspoons: "teaspoon",
    tsp: "teaspoon",
  };

  if (replacements[normalized]) {
    return replacements[normalized];
  }

  if (normalized.endsWith("ies")) {
    return normalized.slice(0, -3) + "y";
  }

  if (normalized.endsWith("es")) {
    return normalized.slice(0, -2);
  }

  if (normalized.endsWith("s") && normalized.length > 3) {
    return normalized.slice(0, -1);
  }

  return normalized;
};

const parseQuantity = (value: any): number => {
  if (typeof value === "number") return value;

  if (!value) return 0;

  const str = String(value).trim();

  if (str.includes("/")) {
    const [num, den] = str.split("/").map(Number);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      return num / den;
    }
  }

  return Number(str) || 0;
};

// =========================
// GET ALL RECIPES
// =========================
export const getRecipes = async (req: AuthRequest, res: Response) => {
  const { sort } = req.query;
  const orderColumn = sort === 'popular' ? 'view_count' : 'created_at';
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
  .from("recipes")
  .select(
    `*, profiles (username, first_name, last_name, avatar_url), reviews(rating)`,
    { count: "exact" }
  )
  .eq("is_public", true)
  .order(orderColumn, { ascending: false })
  .range(from, to);

  if (error) return res.status(500).json({ error: error.message });
  res.json({
  data,
  page,
  limit,
  total: count || 0,
  hasMore: to + 1 < (count || 0),
});
};

// =========================
// GET SINGLE RECIPE
// =========================
export const getRecipe = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('*, profiles(username, first_name, last_name, avatar_url)')
    .eq('id', id)
    .maybeSingle()

  if (error) return res.status(404).json({ error: 'Recipe not found' });

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('*')
    .eq('recipe_id', id);

  const { data: steps } = await supabase
    .from('steps')
    .select('*')
    .eq('recipe_id', id)
    .order('step_number');

  await supabase.rpc('increment_view_count', { recipe_id: id });

  res.json({ ...recipe, ingredients, steps });
};

export const createRecipe = async (req: AuthRequest, res: Response) => {

  const {
    title,
    description,
    prep_time,
    cook_time,
    servings,
    image_url,
    meal_type,
    cuisine_type,
    cook_duration,
    ingredients,
    steps,
    generate_image,
  } = req.body;

  const mealTypes = Array.isArray(meal_type)
  ? meal_type
  : meal_type
    ? [meal_type]
    : [];

  const finalImageUrl =
    generate_image && !image_url
      ? generatePollinationsImageUrl(title, description)
      : image_url;

  const { data: recipe, error } = await supabase
    .from('recipes')
    .insert({
      title,
      description,
      prep_time,
      cook_time,
      servings,
      image_url: finalImageUrl,
      meal_type: mealTypes,
      cuisine_type,
      cook_duration,
      user_id: req.user!.id,
    })
    .select()
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message });

  if (ingredients?.length) {
    await supabase.from('ingredients').insert(
      ingredients.map((i: any) => ({
        ...i,
        recipe_id: recipe.id,
      }))
    );
  }

  if (steps?.length) {
    await supabase.from('steps').insert(
      steps.map((s: any, index: number) => ({
        recipe_id: recipe.id,
        step_number: index + 1,
        instruction: s.instruction,
      }))
    );
  }

  res.status(201).json(recipe);
};

// =========================
// UPDATE RECIPE
// =========================
export const updateRecipe = async (req: AuthRequest, res: Response) => {

  const { id } = req.params;

  const {
    title,
    description,
    prep_time,
    cook_time,
    servings,
    image_url,
    meal_type,
    cuisine_type,
    cook_duration,
    ingredients,
    steps,
  } = req.body;

  const mealTypes = Array.isArray(meal_type)
  ? meal_type
  : meal_type
    ? [meal_type]
    : [];

  const { data, error } = await supabase
    .from('recipes')
    .update({
      title,
      description,
      prep_time,
      cook_time,
      servings,
      image_url,
      meal_type: mealTypes,
      cuisine_type,
      cook_duration,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0)
    return res.status(403).json({ error: 'Not authorized or recipe not found' });

  await supabase.from('ingredients').delete().eq('recipe_id', id);
  await supabase.from('steps').delete().eq('recipe_id', id);

  if (ingredients?.length) {
    await supabase.from('ingredients').insert(
      ingredients.map((i: any) => ({
        ...i,
        recipe_id: id,
      }))
    );
  }

  if (steps?.length) {
    await supabase.from('steps').insert(
      steps.map((s: any, index: number) => ({
        recipe_id: id,
        step_number: index + 1,
        instruction: s.instruction,
      }))
    );
  }

  res.json({ message: 'Recipe updated' });
};

// =========================
// DELETE RECIPE
// =========================
export const deleteRecipe = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user!.id);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: 'Recipe deleted' });
};

// =========================
// GET MY RECIPES
// =========================
export const getMyRecipes = async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
};

export const cookRecipe = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { data: ingredients, error: ingError } = await supabase
    .from("ingredients")
    .select("*")
    .eq("recipe_id", id);

  if (ingError) return res.status(500).json({ error: ingError.message });

  if (!ingredients?.length) {
    return res.status(400).json({ error: "No ingredients found for this recipe" });
  }

  const { data: pantry, error: pantryError } = await supabase
    .from("pantry_items")
    .select("*")
    .eq("user_id", req.user!.id);

  if (pantryError) return res.status(500).json({ error: pantryError.message });

  const deductions: any[] = [];

  // STEP 1: Validate everything first. Do not deduct yet.
  for (const ingredient of ingredients) {
    const neededAmount = parseQuantity(ingredient.amount);
    if (Number.isNaN(neededAmount) || neededAmount <= 0) continue;

    const recipeIngredientName = normalizeIngredientName(ingredient.name);

    const pantryItem = pantry?.find(
      (p) => normalizeIngredientName(p.name) === recipeIngredientName
    );

    if (!pantryItem) {
      return res.status(400).json({
        error: `Missing ingredient: ${ingredient.name}`,
      });
    }

    const currentQuantity = parseQuantity(pantryItem.quantity);

    if (currentQuantity < neededAmount) {
      return res.status(400).json({
        error: `Not enough ${ingredient.name}`,
      });
    }

    const remainingQuantity = currentQuantity - neededAmount;

    deductions.push({
      pantryItem,
      name: pantryItem.name,
      before: currentQuantity,
      used: neededAmount,
      after: Math.max(remainingQuantity, 0),
      unit: pantryItem.unit,
      removed: remainingQuantity <= 0,
    });
  }

  // STEP 2: Only deduct after all ingredients passed validation.
  for (const item of deductions) {
    await supabase.from("pantry_history").insert({
      user_id: req.user!.id,
      recipe_id: id,
      ingredient_name: item.name,
      quantity_used: item.used,
      activity: "used",
    });

    const { error: logError } = await supabase
      .from("pantry_usage_logs")
      .insert({
        user_id: req.user!.id,
        recipe_id: id,
        ingredient_name: item.name,
        quantity_used: item.used,
        unit: item.unit,
      });

    if (logError) {
      return res.status(500).json({ error: logError.message });
    }

    if (item.removed) {
      const { error: deleteError } = await supabase
        .from("pantry_items")
        .delete()
        .eq("id", item.pantryItem.id)
        .eq("user_id", req.user!.id);

      if (deleteError) return res.status(500).json({ error: deleteError.message });
    } else {
      const { error: updateError } = await supabase
        .from("pantry_items")
        .update({ quantity: item.after })
        .eq("id", item.pantryItem.id)
        .eq("user_id", req.user!.id);

      if (updateError) return res.status(500).json({ error: updateError.message });
    }
  }

  res.json({
    message: "Recipe cooked successfully. Pantry updated.",
    deductions: deductions.map(({ pantryItem, ...rest }) => rest),
  });
};