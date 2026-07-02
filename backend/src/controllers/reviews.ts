import { Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

export const getReviews = async (req: AuthRequest, res: Response) => {
  const { recipe_id } = req.params;

  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(first_name, last_name, username, avatar_url)')
    .eq('recipe_id', recipe_id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const createReview = async (req: AuthRequest, res: Response) => {
  const { recipe_id } = req.params;
  const { rating, comment, difficulty, is_good } = req.body;

  const { data, error } = await supabase
    .from('reviews')
    .insert({ recipe_id, rating, comment, difficulty, is_good, user_id: req.user!.id })
    .select('*, profiles(first_name, last_name, username, avatar_url)')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

export const updateReview = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { rating, comment, difficulty, is_good } = req.body;

  const { data, error } = await supabase
    .from('reviews')
    .update({ rating, comment, difficulty, is_good })
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .select('*, profiles(first_name, last_name, username, avatar_url)')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const deleteReview = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user!.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Review deleted' });
};