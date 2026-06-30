import { Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

export const getRecipes = async (req: AuthRequest, res: Response) => {
  const { sort } = req.query;
  const orderColumn = sort === 'popular' ? 'view_count' : 'created_at';

  const { data, error } = await supabase
    .from('recipes')
    .select('*, profiles(username, first_name, last_name, avatar_url)')
    .eq('is_public', true)
    .order(orderColumn, { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const getRecipe = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const [{ data: recipe, error }, { data: ingredients }, { data: steps }] =
    await Promise.all([
      supabase.from('recipes').select('*, profiles(username, first_name, last_name, avatar_url)').eq('id', id).single(),
      supabase.from('ingredients').select('*').eq('recipe_id', id),
      supabase.from('steps').select('*').eq('recipe_id', id).order('step_number'),
    ]);

  if (error) return res.status(404).json({ error: 'Recipe not found' });

  // Increment view count
  await supabase.rpc('increment_view_count', { recipe_id: id });

  res.json({ ...recipe, ingredients, steps });
};

export const createRecipe = async (req: AuthRequest, res: Response) => {
  const { title, description, prep_time, cook_time, servings, image_url, meal_type, cuisine_type, cook_duration, ingredients, steps } = req.body;

const { data: recipe, error } = await supabase
  .from('recipes')
  .insert({ title, description, prep_time, cook_time, servings, image_url, meal_type, cuisine_type, cook_duration, user_id: req.user!.id })
  .select()
  .single();

  if (error) return res.status(500).json({ error: error.message });

  if (ingredients?.length) {
    await supabase.from('ingredients').insert(
      ingredients.map((i: any) => ({ ...i, recipe_id: recipe.id }))
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

export const updateRecipe = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, prep_time, cook_time, servings, image_url, meal_type, cuisine_type, cook_duration, ingredients, steps } = req.body;

  console.log('Updating recipe:', id);
  console.log('User ID:', req.user?.id);
  console.log('Body:', req.body);

  const { data, error } = await supabase
  .from('recipes')
  .update({ title, description, prep_time, cook_time, servings, image_url, meal_type, cuisine_type, cook_duration, updated_at: new Date().toISOString() })
  .eq('id', id)
  .eq('user_id', req.user!.id)
  .select();

  console.log('Update result:', data, error);

  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(403).json({ error: 'Not authorized or recipe not found' });

  await supabase.from('ingredients').delete().eq('recipe_id', id);
  await supabase.from('steps').delete().eq('recipe_id', id);

  if (ingredients?.length) {
    await supabase.from('ingredients').insert(
      ingredients.map((i: any) => ({ ...i, recipe_id: id }))
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

export const getMyRecipes = async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};