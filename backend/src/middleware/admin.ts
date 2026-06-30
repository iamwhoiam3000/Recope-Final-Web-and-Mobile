import { Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { AuthRequest } from './auth';

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', req.user!.id)
    .single();

  if (error || !data?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};