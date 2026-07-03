import { Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

export const getProfile = async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user!.id)
    .single();

  if (error) return res.status(404).json({ error: 'Profile not found' });
  res.json(data);
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const { first_name, last_name, avatar_url } = req.body;
  const userId = req.user!.id;

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  const fallbackUsername =
    existingProfile?.username || `user_${userId.slice(0, 8)}`;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        username: fallbackUsername,
        first_name,
        last_name,
        avatar_url,
      },
      { onConflict: "id" }
    )
    .select()
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    // Delete user-owned data first
    await supabase.from("favorites").delete().eq("user_id", userId);
    await supabase.from("reviews").delete().eq("user_id", userId);
    await supabase.from("pantry_history").delete().eq("user_id", userId);
    await supabase.from("pantry_usage_logs").delete().eq("user_id", userId);
    await supabase.from("pantry_items").delete().eq("user_id", userId);

    // Get user's recipes
    const { data: recipes } = await supabase
      .from("recipes")
      .select("id")
      .eq("user_id", userId);

    const recipeIds = recipes?.map((r: any) => r.id) || [];

    if (recipeIds.length > 0) {
      await supabase.from("favorites").delete().in("recipe_id", recipeIds);
      await supabase.from("reviews").delete().in("recipe_id", recipeIds);
      await supabase.from("ingredients").delete().in("recipe_id", recipeIds);
      await supabase.from("steps").delete().in("recipe_id", recipeIds);
      await supabase.from("recipes").delete().in("id", recipeIds);
    }

    // Delete profile
    await supabase.from("profiles").delete().eq("id", userId);

    // Delete Supabase auth user
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: "Account and all related data deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};