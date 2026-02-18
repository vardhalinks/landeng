// Browser-safe API configuration
const API_BASE = 'https://landeng.onrender.com/api';

const API = {
  get: async (path) => {
    const res = await fetch(API_BASE + path);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return { data };
  },

  post: async (path, payload) => {
    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return { data };
  },

  put: async (path, payload) => {
    const res = await fetch(API_BASE + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return { data };
  },

  delete: async (path) => {
    const res = await fetch(API_BASE + path, { method: 'DELETE' });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return { data };
  },
};

export default API;
