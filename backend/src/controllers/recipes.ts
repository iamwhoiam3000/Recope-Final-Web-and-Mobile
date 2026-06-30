import { Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

export const cookRecipe = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  // 1. Get recipe ingredients
  const { data: ingredients, error: ingError } = await supabase
    .from('ingredients')
    .select('name, quantity')
    .eq('recipe_id', id);

  if (ingError) return res.status(500).json({ error: ingError.message });
  if (!ingredients?.length) {
    return res.status(400).json({ error: 'No ingredients found for this recipe' });
  }

  // 2. Get user's pantry
  const { data: pantry, error: pantryError } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', userId);

  if (pantryError) return res.status(500).json({ error: pantryError.message });

  // 3. Validate availability first
  for (const ingredient of ingredients) {
    const pantryItem = pantry.find(
      (p) =>
        p.name.toLowerCase().trim() ===
        ingredient.name.toLowerCase().trim()
    );

    if (!pantryItem) {
      return res.status(400).json({
        error: `Missing ingredient: ${ingredient.name}`,
      });
    }

    if (pantryItem.quantity < ingredient.quantity) {
      return res.status(400).json({
        error: `Not enough ${ingredient.name}`,
      });
    }
  }

  // 4. Deduct ingredients
  for (const ingredient of ingredients) {
    const pantryItem = pantry.find(
      (p) =>
        p.name.toLowerCase().trim() ===
        ingredient.name.toLowerCase().trim()
    );

    const newQuantity = pantryItem.quantity - ingredient.quantity;

    const { error } = await supabase
      .from('pantry_items')
      .update({ quantity: newQuantity })
      .eq('id', pantryItem.id);

    if (error) return res.status(500).json({ error: error.message });
  }

  return res.json({
    message: 'Recipe cooked successfully. Pantry updated.',
  });
};
