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
    logger.log('[axiosInstance] 📤 Исходящий запрос:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'N/A'
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      logger.log('[axiosInstance] ✅ Токен добавлен в заголовок Authorization');
    } else {
      logger.warn('[axiosInstance] ⚠️ Токен отсутствует, запрос без авторизации');
    }
    
    return config;
  },
  (error) => {
    logger.error('[axiosInstance] ❌ Ошибка перед отправкой запроса:', error);
    return Promise.reject(error);
  }
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
  (response) => {
    logger.log('[axiosInstance] ✅ Успешный ответ:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method
    });
    return response;
  },
  async (error: AxiosError) => {
    logger.error('[axiosInstance] ❌ Ошибка запроса:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message
    });
    
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      logger.error('[axiosInstance] ❌ originalRequest отсутствует!');
      return Promise.reject(error);
    }

    // Проверяем, является ли это Network Error (CORS или нет сети)
    const isNetworkError = error.message === 'Network Error' && !error.response;
    
    logger.log('[axiosInstance] Проверка условий для retry:', {
      status: error.response?.status,
      is401: error.response?.status === 401,
      isNetworkError,
      alreadyRetried: originalRequest._retry,
      shouldRetry: error.response?.status === 401 && !originalRequest._retry
    });

    // Network Error может быть из-за невалидного токена или CORS
    if (isNetworkError && !originalRequest._retry) {
      logger.warn('[axiosInstance] ⚠️ Network Error обнаружен, возможно проблема с CORS или токеном');
      logger.log('[axiosInstance] Пробуем обновить токен на случай, если он невалидный...');
      
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Удаляем старый токен и пробуем авторизоваться заново
        await removeToken();
        
        const initDataRaw = getInitDataRaw();
        logger.log('[axiosInstance] Init data для повторной авторизации (Network Error):', {
          hasInitData: !!initDataRaw,
          initDataLength: initDataRaw?.length || 0
        });
        
        if (initDataRaw) {
          logger.log('[axiosInstance] Отправляем запрос на авторизацию с init data...');
          const freshToken = await authorize(initDataRaw);
          
          if (freshToken) {
            logger.log('[axiosInstance] ✅ Получен новый токен, повторяем запрос');
            store.dispatch(setReduxToken(freshToken));
            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
            isRefreshing = false;
            return api(originalRequest);
          }
        }
        
        logger.error('[axiosInstance] ❌ Не удалось получить токен после Network Error');
        isRefreshing = false;
        return Promise.reject(error);
      } catch (reAuthErr) {
        logger.error('[axiosInstance] ❌ Ошибка при повторной авторизации после Network Error:', reAuthErr);
        isRefreshing = false;
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      logger.log('[axiosInstance] 🔄 Получен 401, начинаем процесс обновления токена...');
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