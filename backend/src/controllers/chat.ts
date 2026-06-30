import { Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

export const getChatHistory = async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const saveChatMessage = async (req: AuthRequest, res: Response) => {
  const { role, content, recipe } = req.body;

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ role, content, recipe, user_id: req.user!.id })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

export const clearChatHistory = async (req: AuthRequest, res: Response) => {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('user_id', req.user!.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Chat history cleared' });
};