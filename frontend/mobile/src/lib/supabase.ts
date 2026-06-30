import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = 'https://jfihtmlleankvijeftfq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmaWh0bWxsZWFua3ZpamVmdGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4Mjc0MzcsImV4cCI6MjA5ODQwMzQzN30.eBp73IUu-1EGKkAv70t9OGnLgUuqjaJPDql2GG2wuC4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});