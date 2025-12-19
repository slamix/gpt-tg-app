import axios from "axios";
import { setToken } from "../utils/tokenStorage";
import { logger } from "../utils/logger";

const API_URL = import.meta.env.VITE_API_HOST;

// Создаем отдельный инстанс для авторизации БЕЗ interceptor'ов
// чтобы избежать циклических зависимостей
const authAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 
    "Content-Type": "application/json",
  },
  // Важно: добавляем timeout
  timeout: 30000,
});

// Minimal logging for auth requests
authAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logger.error('[DEBUG] Auth request failed: 401 Unauthorized');
    } else if (!error.response) {
      logger.error('[DEBUG] Auth request failed: Network Error');
    }
    return Promise.reject(error);
  }
);

/**
 * Авторизация через Telegram init data
 * 
 * Поддерживает два метода отправки:
 * 1. В теле запроса (по умолчанию) - для совместимости с текущим API
 * 2. В заголовке Authorization - согласно рекомендациям Telegram Mini Apps
 * 
 * Для переключения на заголовок установите USE_HEADER_AUTH=true
 */
const USE_HEADER_AUTH = import.meta.env.VITE_USE_HEADER_AUTH === 'true';

export async function authorize(initData: string): Promise<string> {
  try {
    let response;
    
    if (USE_HEADER_AUTH) {
      response = await authAxios.post('auth/telegram', {}, {
        headers: {
          'Authorization': `tma ${initData}`
        }
      });
    } else {
      response = await authAxios.post('auth/telegram', { initData });
    }
    
    const { data } = response;
    const { access_token } = data;
    
    if (!access_token) {
      logger.error('[DEBUG] Server returned no access_token');
      throw new Error('Server returned no access_token');
    }
    
    await setToken(access_token);
    logger.log('[DEBUG] Authorization successful');
    
    return access_token;
  } catch (error: any) {
    logger.error('[DEBUG] Authorization error:', error.message);
    throw error;
  }
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
      
      if (access_token) {
        await setToken(access_token);
        logger.log('[DEBUG] Token refreshed');
        return access_token;
      }
      
      return null;
    } catch (err: any) {
      logger.error('[DEBUG] Token refresh failed');
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
