import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getToken, setToken, removeToken } from "@/utils/tokenStorage";
import { refreshToken, authorize } from "./authApi";
import { store } from "@/slices";
import { setToken as setReduxToken } from "@/slices/authSlice";
import { getInitDataRaw } from "@/utils/initData";
import { logger } from "@/utils/logger";

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_HOST}`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

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

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
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
        const newToken = await refreshToken();
        
        if (newToken) {
          await setToken(newToken);
          store.dispatch(setReduxToken(newToken));
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          isRefreshing = false;
          return api(originalRequest);
        } else {
          logger.log('[axiosInstance] Refresh token не вернул новый токен, пробуем авторизацию через init data...');
          await removeToken();
          
          const initDataRaw = getInitDataRaw();
          logger.log('[axiosInstance] Init data для повторной авторизации:', {
            hasInitData: !!initDataRaw,
            initDataLength: initDataRaw?.length || 0
          });
          
          if (initDataRaw) {
            logger.log('[axiosInstance] Отправляем запрос на авторизацию с init data...');
            const freshToken = await authorize(initDataRaw);
            
            logger.log('[axiosInstance] Результат авторизации:', {
              hasToken: !!freshToken,
              tokenLength: freshToken?.length || 0
            });
            
            if (freshToken) {
              logger.log('[axiosInstance] ✅ Получен новый токен через init data');
              store.dispatch(setReduxToken(freshToken));
              originalRequest.headers.Authorization = `Bearer ${freshToken}`;
              processQueue(null, freshToken);
              isRefreshing = false;
              return api(originalRequest);
            }
          }
          
          logger.error('[axiosInstance] ❌ Не удалось получить токен, сессия истекла');
          store.dispatch(setReduxToken(null));
          processQueue(new Error('Сессия истекла'), null);
          isRefreshing = false;
          return Promise.reject(new Error('Сессия истекла'));
        }
      } catch (err) {
        logger.error('[axiosInstance] ❌ Ошибка при обновлении токена:', err);
        
        try {
          logger.log('[axiosInstance] Попытка повторной авторизации через init data после ошибки...');
          await removeToken();
          
          const initDataRaw = getInitDataRaw();
          logger.log('[axiosInstance] Init data для повторной авторизации (catch):', {
            hasInitData: !!initDataRaw,
            initDataLength: initDataRaw?.length || 0
          });
          
          if (initDataRaw) {
            logger.log('[axiosInstance] Отправляем запрос на авторизацию с init data (catch)...');
            const freshToken = await authorize(initDataRaw);
            
            logger.log('[axiosInstance] Результат авторизации (catch):', {
              hasToken: !!freshToken,
              tokenLength: freshToken?.length || 0
            });
            
            if (freshToken) {
              logger.log('[axiosInstance] ✅ Получен новый токен через init data (catch)');
              store.dispatch(setReduxToken(freshToken));
              originalRequest.headers.Authorization = `Bearer ${freshToken}`;
              processQueue(null, freshToken);
              isRefreshing = false;
              return api(originalRequest);
            }
          }
        } catch (reAuthErr) {
          logger.error('[axiosInstance] ❌ Ошибка при повторной авторизации:', reAuthErr);
        }
        
        logger.error('[axiosInstance] ❌ Все попытки авторизации провалились');
        store.dispatch(setReduxToken(null));
        processQueue(err as Error, null);
        isRefreshing = false;
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);