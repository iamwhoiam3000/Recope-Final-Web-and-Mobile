import { Response } from "express";
import { supabase } from "../lib/supabase";
import { AuthRequest } from "../middleware/auth";

export const getFavorites = async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from("favorites")
    .select("*, recipes(*, profiles(username, first_name, last_name, avatar_url), reviews(rating))")
    .eq("user_id", req.user!.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const addFavorite = async (req: AuthRequest, res: Response) => {
  const { recipe_id } = req.body;

  const { data, error } = await supabase
    .from("favorites")
    .insert({
      user_id: req.user!.id,
      recipe_id,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

export const removeFavorite = async (req: AuthRequest, res: Response) => {
  const { recipe_id } = req.params;

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", req.user!.id)
    .eq("recipe_id", recipe_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Favorite removed" });
};