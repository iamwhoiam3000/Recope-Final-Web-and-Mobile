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
  const { name, quantity, unit } = req.body;

  const { data, error } = await supabase
    .from('pantry_items')
    .insert({ name, quantity, unit, user_id: req.user!.id })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
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
  const { name, quantity, unit } = req.body;

  const { data, error } = await supabase
    .from('pantry_items')
    .update({ name, quantity, unit })
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .select()
    .single();

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
    .select('*, ingredients(name)')
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