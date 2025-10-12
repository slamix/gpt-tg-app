import axios from "axios";
import { setToken } from "../utils/tokenStorage";

const API_URL = import.meta.env.VITE_API_HOST;

const authAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export async function authorize(initData: string): Promise<string> {
  const { data } = await authAxios.post('auth/telegram', { initData });
  const { access_token } = data;
  await setToken(access_token);
  return access_token;
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export async function refreshToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  
  refreshPromise = (async () => {
    try {
      const { data } = await authAxios.post('auth/refresh');
      const { access_token } = data;
      await setToken(access_token);
      return access_token;
    } catch (err: any) {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
