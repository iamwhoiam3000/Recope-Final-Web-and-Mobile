import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = 'https://yzxbqwbiwpdwppxalxjz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6eGJxd2Jpd3Bkd3BweGFseGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MzkxMDgsImV4cCI6MjA5ODQxNTEwOH0.eVrhHSnVZD-1s1Ka736dAvm2WPNwMr4Yo6SKcNitcrE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
