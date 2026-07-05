import { Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

export const getPantry = async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('name');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const addPantryItem = async (req: AuthRequest, res: Response) => {
  console.log("Add pantry body:", req.body);

  const { name, quantity, unit, expiration_date } = req.body;

  const { data, error } = await supabase
    .from('pantry_items')
    .insert({ name, quantity, unit, expiration_date: expiration_date || null, user_id: req.user!.id })
    .select()
    .maybeSingle();

  if (error) {
  console.error("Add pantry insert error:", error);
  return res.status(500).json({ error: error.message });
}

  const { error: historyError } = await supabase.from("pantry_history").insert({
  user_id: req.user!.id,
  ingredient_name: name,
  quantity_added: Number(quantity) || 0,
  activity: "added",
});

if (historyError) {
  console.error("Pantry history insert error:", historyError.message);
}

  res.status(201).json(data);
};

export const deletePantryItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user!.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Item deleted' });
};

export const updatePantryItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, quantity, unit, expiration_date } = req.body;

  const { data, error } = await supabase
    .from('pantry_items')
    .update({ name, quantity, unit, expiration_date })
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .select()
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const matchRecipes = async (req: AuthRequest, res: Response) => {
  const { data: pantryItems, error: pantryError } = await supabase
    .from('pantry_items')
    .select('name')
    .eq('user_id', req.user!.id);

  if (pantryError) return res.status(500).json({ error: pantryError.message });
  if (!pantryItems?.length) return res.json([]);

  const pantryNames = pantryItems.map(i => i.name.toLowerCase());

  const { data: recipes, error: recipesError } = await supabase
  .from('recipes')
  .select(`
    *,
    ingredients(name),
    profiles(username, first_name, last_name, full_name, avatar_url),
    reviews(rating)
  `)
  .eq('is_public', true);

  if (recipesError) return res.status(500).json({ error: recipesError.message });

  const matched = recipes
    .map(recipe => {
      const recipeIngredients = recipe.ingredients.map((i: any) => i.name.toLowerCase());
      const matchedCount = recipeIngredients.filter((ing: string) =>
        pantryNames.some(p => ing.includes(p) || p.includes(ing))
      ).length;
      const totalCount = recipeIngredients.length;
      const matchPercent = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;
      return { ...recipe, matchedCount, totalCount, matchPercent };
    })
    .filter(r => r.matchedCount > 0)
    .sort((a, b) => b.matchPercent - a.matchPercent);

  res.json(matched);
};