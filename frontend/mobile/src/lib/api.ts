import { supabase } from './supabase';

const BASE_URL ="https://recope-backend.onrender.com";

const getToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};

const request = async (method: string, path: string, body?: any) => {
  const token = await getToken();
  
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();
  return data;
};

const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body: any) => request('POST', path, body),
  put: (path: string, body: any) => request('PUT', path, body),
  remove: (path: string) => request('DELETE', path),
};

export default api;