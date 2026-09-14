import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let clerkTokenGetter = null;
export const setClerkTokenGetter = (getter) => { clerkTokenGetter = getter; };

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  if (clerkTokenGetter) {
    const token = await clerkTokenGetter();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiMessage = (err, fallback = 'Request failed') =>
  err?.response?.data?.error?.message || err?.message || fallback;
