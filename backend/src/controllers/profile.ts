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

  const { data, error } = await supabase
    .from('profiles')
    .update({ first_name, last_name, avatar_url })
    .eq('id', req.user!.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};