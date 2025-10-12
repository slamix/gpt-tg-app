// src/api/axiosInstance.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getToken, setToken, removeToken } from "@/utils/tokenStorage";
import { refreshToken, authorize } from "./authApi";
import { store } from "@/slices";
import { setToken as setReduxToken } from "@/slices/authSlice";
import { retrieveRawInitData } from "@telegram-apps/sdk";

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
          console.log('✅ Токен успешно обновлён через /auth/refresh, повторяем запрос');
          await setToken(newToken);
          store.dispatch(setReduxToken(newToken));
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          isRefreshing = false;
          return api(originalRequest);
        } else {
          // Refresh не удался - пытаемся авторизоваться заново через initData
          console.warn('⚠️ Refresh токен истёк, пытаемся авторизоваться заново через initData...');
          await removeToken();
          
          const initData = retrieveRawInitData();
          if (initData) {
            console.log('🔐 initData получены, запускаем повторную авторизацию...');
            const freshToken = await authorize(initData);
            
            if (freshToken) {
              console.log('✅ Повторная авторизация успешна, повторяем запрос');
              store.dispatch(setReduxToken(freshToken));
              originalRequest.headers.Authorization = `Bearer ${freshToken}`;
              processQueue(null, freshToken);
              isRefreshing = false;
              return api(originalRequest);
            }
          }
          
          // Если не удалось получить initData или авторизоваться
          console.error('❌ Не удалось авторизоваться заново, необходимо перезапустить приложение');
          store.dispatch(setReduxToken(null));
          processQueue(new Error('Сессия истекла'), null);
          isRefreshing = false;
          return Promise.reject(new Error('Сессия истекла'));
        }
      } catch (err) {
        console.error('❌ Ошибка при рефреше токена:', err);
        
        // Пытаемся авторизоваться заново через initData
        try {
          console.warn('⚠️ Пытаемся авторизоваться заново через initData...');
          await removeToken();
          
          const initData = retrieveRawInitData();
          if (initData) {
            console.log('🔐 initData получены, запускаем повторную авторизацию...');
            const freshToken = await authorize(initData);
            
            if (freshToken) {
              console.log('✅ Повторная авторизация успешна, повторяем запрос');
              store.dispatch(setReduxToken(freshToken));
              originalRequest.headers.Authorization = `Bearer ${freshToken}`;
              processQueue(null, freshToken);
              isRefreshing = false;
              return api(originalRequest);
            }
          }
        } catch (reAuthErr) {
          console.error('❌ Повторная авторизация не удалась:', reAuthErr);
        }
        
        store.dispatch(setReduxToken(null));
        processQueue(err as Error, null);
        isRefreshing = false;
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);
