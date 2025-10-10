import axios from "axios";
import { setToken } from "../utils/tokenStorage";

const API_URL = import.meta.env.VITE_API_HOST;

// Создаём отдельный axios instance для auth запросов (без interceptor)
const authAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export async function authorize(initData: string): Promise<string> {
  console.log('🔐 Начинаем авторизацию с initData:', initData.substring(0, 50) + '...');
  console.log(initData);
  const { data } = await authAxios.post('auth/telegram', { initData });
  // Check if cookie exists
  console.log('All cookies:', document.cookie);

  // Check specific cookie
  const cookies = document.cookie.split(';');
  const refreshToken = cookies.find(c => c.trim().startsWith('refresh_token='));
  console.log('Refresh token cookie:', refreshToken);
  console.log('✅ Авторизация успешна, получен токен');
  const { access_token } = data;
  await setToken(access_token);
  return access_token;
}

// Переменная для предотвращения множественных одновременных рефрешей
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export async function refreshToken(): Promise<string | null> {
  // Если уже идёт рефреш - возвращаем тот же промис
  if (isRefreshing && refreshPromise) {
    console.log('⏳ Рефреш уже идёт, ждём...');
    return refreshPromise;
  }

  isRefreshing = true;
  
  refreshPromise = (async () => {
    try {
      console.log('🔄 Отправляем запрос на auth/refresh с cookies...');
      const { data } = await authAxios.post('auth/refresh');
      console.log('✅ Токен успешно обновлён через refresh');
      const { access_token } = data;
      await setToken(access_token);
      return access_token;
    } catch (err: any) {
      console.error("❌ Ошибка refresh:", err?.response?.status, err?.response?.data || err?.message);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
