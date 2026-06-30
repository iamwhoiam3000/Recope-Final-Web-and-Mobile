import { Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  const [
    { count: totalUsers },
    { count: totalRecipes },
    { data: recipes },
    { data: recentUsers },
    { data: topRecipes },
    { data: recipesByMeal },
    { data: recipesByCuisine },
    { data: recipesByDuration },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('recipes').select('*', { count: 'exact', head: true }),
    supabase.from('recipes').select('created_at'),
    supabase.from('profiles')
      .select('id, first_name, last_name, username, avatar_url, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('recipes')
      .select('id, title, view_count, profiles(first_name, last_name, username)')
      .order('view_count', { ascending: false })
      .limit(5),
    supabase.from('recipes').select('meal_type').not('meal_type', 'is', null),
    supabase.from('recipes').select('cuisine_type').not('cuisine_type', 'is', null),
    supabase.from('recipes').select('cook_duration').not('cook_duration', 'is', null),
  ]);

  // Recipes per month (last 6 months)
  const recipesPerMonth: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    recipesPerMonth[key] = 0;
  }
  recipes?.forEach(r => {
    const d = new Date(r.created_at);
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (key in recipesPerMonth) recipesPerMonth[key]++;
  });

  // Meal type breakdown
  const mealTypeCount: Record<string, number> = {};
  recipesByMeal?.forEach(r => {
    if (r.meal_type) mealTypeCount[r.meal_type] = (mealTypeCount[r.meal_type] || 0) + 1;
  });

  // Cuisine type breakdown
  const cuisineTypeCount: Record<string, number> = {};
  recipesByCuisine?.forEach(r => {
    if (r.cuisine_type) cuisineTypeCount[r.cuisine_type] = (cuisineTypeCount[r.cuisine_type] || 0) + 1;
  });

  // Cook duration breakdown
  const durationCount: Record<string, number> = {};
  recipesByDuration?.forEach(r => {
    if (r.cook_duration) durationCount[r.cook_duration] = (durationCount[r.cook_duration] || 0) + 1;
  });

  res.json({
    totalUsers,
    totalRecipes,
    recipesPerMonth,
    recentUsers,
    topRecipes,
    mealTypeCount,
    cuisineTypeCount,
    durationCount,
  });
};