const BASE_URL = process.env.REACT_APP_API_URL || 'https://recope-backend.onrender.com';

const getToken = async () => {
  const { supabase } = await import('./supabase');
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};

const api = {
  get: async (path: string) => {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  post: async (path: string, body: any) => {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return res.json();
  },

  put: async (path: string, body: any) => {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return res.json();
  },

  delete: async (path: string) => {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
};

export default api;