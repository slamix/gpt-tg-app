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

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isNetworkError = error.message === 'Network Error' && !error.response;

    // Handle Network Error
    if (isNetworkError && !originalRequest._retry) {
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await removeToken();
        const initDataRaw = getInitDataRaw();
        
        if (initDataRaw) {
          const freshToken = await authorize(initDataRaw);
          
          if (freshToken) {
            logger.log('[DEBUG] Token refreshed after network error');
            store.dispatch(setReduxToken(freshToken));
            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
            isRefreshing = false;
            return api(originalRequest);
          }
        }
        
        isRefreshing = false;
        return Promise.reject(error);
      } catch (reAuthErr) {
        isRefreshing = false;
        return Promise.reject(error);
      }
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      logger.log('[DEBUG] 401 Unauthorized, refreshing token');
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
          await removeToken();
          const initDataRaw = getInitDataRaw();
          
          if (initDataRaw) {
            const freshToken = await authorize(initDataRaw);
            
            if (freshToken) {
              logger.log('[DEBUG] Re-authorized with init data');
              store.dispatch(setReduxToken(freshToken));
              originalRequest.headers.Authorization = `Bearer ${freshToken}`;
              processQueue(null, freshToken);
              isRefreshing = false;
              return api(originalRequest);
            }
          }
          
          logger.error('[DEBUG] Session expired');
          store.dispatch(setReduxToken(null));
          processQueue(new Error('Session expired'), null);
          isRefreshing = false;
          return Promise.reject(new Error('Session expired'));
        }
      } catch (err) {
        try {
          await removeToken();
          const initDataRaw = getInitDataRaw();
          
          if (initDataRaw) {
            const freshToken = await authorize(initDataRaw);
            
            if (freshToken) {
              logger.log('[DEBUG] Re-authorized after error');
              store.dispatch(setReduxToken(freshToken));
              originalRequest.headers.Authorization = `Bearer ${freshToken}`;
              processQueue(null, freshToken);
              isRefreshing = false;
              return api(originalRequest);
            }
          }
        } catch (reAuthErr) {
          // Silent fail
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