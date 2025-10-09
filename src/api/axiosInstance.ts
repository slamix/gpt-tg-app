// src/api/axiosInstance.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getToken, setToken, removeToken } from "@/utils/tokenStorage";
import { refreshToken } from "./authApi";

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_HOST}`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// 🔒 Request interceptor - просто добавляем токен
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔄 Response interceptor - обрабатываем 401 и рефрешим токен
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Если получили 401 и это не повторная попытка
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Если рефреш уже идёт - добавляем запрос в очередь
      if (isRefreshing) {
        console.log('⏳ Рефреш уже идёт, добавляем запрос в очередь');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            }
            return Promise.reject(new Error('Нет токена после рефреша'));
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Получили 401, пытаемся обновить токен через /auth/refresh...');
        const newToken = await refreshToken();
        
        if (newToken) {
          console.log('✅ Токен успешно обновлён, повторяем запрос');
          await setToken(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          isRefreshing = false;
          return api(originalRequest);
        } else {
          // Refresh не удался - очищаем всё и перезагружаем
          console.error('❌ Refresh вернул 401 - сессия истекла, нужна новая авторизация');
          await removeToken();
          processQueue(new Error('Сессия истекла'), null);
          isRefreshing = false;
          
          // Перезагружаем страницу для новой авторизации
          console.log('🔄 Перезагружаем страницу для новой авторизации...');
          setTimeout(() => window.location.reload(), 500);
          return Promise.reject(error);
        }
      } catch (err) {
        console.error('❌ Ошибка при рефреше:', err);
        await removeToken();
        processQueue(err as Error, null);
        isRefreshing = false;
        
        // Перезагружаем страницу
        console.log('🔄 Перезагружаем страницу для новой авторизации...');
        setTimeout(() => window.location.reload(), 500);
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);
