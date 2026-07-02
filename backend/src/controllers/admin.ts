import { Response } from "express";
import { supabase } from "../lib/supabase";
import { AuthRequest } from "../middleware/auth";

export const getAnalytics = async (req: AuthRequest, res: Response) => {
const [
  usersResult,
  recipesCountResult,
  reviewsResult,
  pantryResult,
  pantryHistoryResult,
  recipesResult,
  recentUsersResult,
  topRecipesResult,
  pantryUsageResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("recipes").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
    supabase.from("pantry_items").select("*", { count: "exact", head: true }),
    supabase.from("pantry_history").select("quantity_added, quantity_used, quantity_expired, activity, created_at"),

    supabase
      .from("recipes")
      .select("created_at, view_count, meal_type, cuisine_type, cook_duration"),

    supabase
      .from("profiles")
      .select("id, first_name, last_name, username, full_name, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("recipes")
      .select("id, title, view_count, profiles(first_name, last_name, username, full_name)")
      .order("view_count", { ascending: false })
      .limit(5),

    supabase
      .from("pantry_usage_logs")
      .select("quantity_used, used_at"),
  ]);

  const totalUsers = usersResult.count || 0;
  const totalRecipes = recipesCountResult.count || 0;
  const totalReviews = reviewsResult.count || 0;
  const totalPantryItems = pantryResult.count || 0;

  const recipes = recipesResult.data || [];
  const recentUsers = recentUsersResult.data || [];
  const topRecipes = topRecipesResult.data || [];
  const pantryUsageLogs = pantryUsageResult.data || [];
  const pantryHistoryLogs = pantryHistoryResult.data || [];

  const recipesPerMonth: Record<string, number> = {};
  const foodWasteReductionByMonth: Record<string, number> = {};
  const foodWasteReductionPercentByMonth: Record<string, number> = {};
  const ingredientsAddedByMonth: Record<string, number> = {};
  const ingredientsUsedByMonth: Record<string, number> = {};
  const ingredientsExpiredByMonth: Record<string, number> = {};

  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("default", {
  month: "short",
});

    recipesPerMonth[key] = 0;
    foodWasteReductionByMonth[key] = 0;
    foodWasteReductionPercentByMonth[key] = 0;
    ingredientsAddedByMonth[key] = 0;
    ingredientsUsedByMonth[key] = 0;
    ingredientsExpiredByMonth[key] = 0;
  }

  let totalViews = 0;
  const mealTypeCount: Record<string, number> = {};
  const cuisineTypeCount: Record<string, number> = {};
  const durationCount: Record<string, number> = {};

  let totalIngredientsAdded = 0;
  let totalIngredientsUsed = 0;
  let totalIngredientsExpired = 0;
  
  const savedIngredientCount: Record<string, number> = {};
  const expiredIngredientCount: Record<string, number> = {};

  recipes.forEach((r: any) => {
    const d = new Date(r.created_at);
    const key = d.toLocaleString("default", {
  month: "short",
});

    if (key in recipesPerMonth) {
      recipesPerMonth[key]++;
    }

    totalViews += Number(r.view_count || 0);

    if (r.meal_type) {
      mealTypeCount[r.meal_type] = (mealTypeCount[r.meal_type] || 0) + 1;
    }

    if (r.cuisine_type) {
      cuisineTypeCount[r.cuisine_type] =
        (cuisineTypeCount[r.cuisine_type] || 0) + 1;
    }

    if (r.cook_duration) {
      durationCount[r.cook_duration] =
        (durationCount[r.cook_duration] || 0) + 1;
    }
  });

  pantryUsageLogs.forEach((log: any) => {
    const d = new Date(log.used_at);
    const key = d.toLocaleString("default", {
  month: "short",
});

    if (key in foodWasteReductionByMonth) {
      foodWasteReductionByMonth[key] += Number(log.quantity_used || 0);
    }
  });

  pantryHistoryLogs.forEach((log: any) => {
  const d = new Date(log.created_at);
  const key = d.toLocaleString("default", {
  month: "short",
});

  if (!(key in ingredientsAddedByMonth)) return;

  ingredientsAddedByMonth[key] += Number(log.quantity_added || 0);
  ingredientsUsedByMonth[key] += Number(log.quantity_used || 0);
  ingredientsExpiredByMonth[key] += Number(log.quantity_expired || 0);

  const added = Number(log.quantity_added || 0);
  const used = Number(log.quantity_used || 0);
  const expired = Number(log.quantity_expired || 0);
  
  totalIngredientsAdded += added;
  totalIngredientsUsed += used;
  totalIngredientsExpired += expired;
  
  if (used > 0) {
  savedIngredientCount[log.ingredient_name] =
    (savedIngredientCount[log.ingredient_name] || 0) + used;
}

if (expired > 0) {
  expiredIngredientCount[log.ingredient_name] =
    (expiredIngredientCount[log.ingredient_name] || 0) + expired;
}
});

Object.keys(foodWasteReductionPercentByMonth).forEach((month) => {
  const added = ingredientsAddedByMonth[month];
  const used = ingredientsUsedByMonth[month];

  foodWasteReductionPercentByMonth[month] =
    added > 0 ? Math.min(100, Math.round((used / added) * 100)) : 0;
});

const foodWasteReductionRate =
  totalIngredientsAdded > 0
    ? Math.round((totalIngredientsUsed / totalIngredientsAdded) * 100)
    : 0;

const topSavedIngredient =
  Object.entries(savedIngredientCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
  "N/A";

const topWastedIngredient =
  Object.entries(expiredIngredientCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
  "N/A";

  res.json({
    totalUsers,
    totalRecipes,
    totalReviews,
    totalPantryItems,
    totalViews,
    averageViews: totalRecipes > 0 ? Math.round(totalViews / totalRecipes) : 0,
    recipesPerMonth,
    foodWasteReductionByMonth,
    recentUsers,
    topRecipes,
    mealTypeCount,
    cuisineTypeCount,
    durationCount,
    foodWasteReductionPercentByMonth,
    ingredientsAddedByMonth,
    ingredientsUsedByMonth,
    ingredientsExpiredByMonth,
    totalIngredientsAdded,
    totalIngredientsUsed,
    totalIngredientsExpired,
    foodWasteReductionRate,
    topSavedIngredient,
    topWastedIngredient,
  });
};