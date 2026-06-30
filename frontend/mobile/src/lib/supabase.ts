import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

<<<<<<< HEAD
const supabaseUrl = 'https://jfihtmlleankvijeftfq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmaWh0bWxsZWFua3ZpamVmdGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4Mjc0MzcsImV4cCI6MjA5ODQwMzQzN30.eBp73IUu-1EGKkAv70t9OGnLgUuqjaJPDql2GG2wuC4';
=======
const supabaseUrl = 'https://kdhfjzwosljwrxhieycy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkaGZqendvc2xqd3J4aGlleWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzM2MzIzMCwiZXhwIjoyMDkyOTM5MjMwfQ.k252qbMtZpG9cppdBAS9kSZNXWlsxZv2jww81zmaArs';
>>>>>>> a6b5b6027d73e130f935979dc76fc69a5ed59d9d

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});