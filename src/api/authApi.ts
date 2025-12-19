import axios from "axios";
import { setToken } from "../utils/tokenStorage";
import { logger } from "../utils/logger";

const API_URL = import.meta.env.VITE_API_HOST;

const authAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export async function authorize(initData: string): Promise<string> {
  logger.log('[authApi] Отправка запроса на авторизацию...');
  logger.log('[authApi] API URL:', API_URL);
  logger.log('[authApi] Init data:', {
    hasInitData: !!initData,
    initDataLength: initData?.length || 0,
    initDataPreview: initData?.substring(0, 100) + '...'
  });
  
  try {
    const { data } = await authAxios.post('auth/telegram', { initData });
    logger.log('[authApi] Ответ от сервера:', {
      hasData: !!data,
      hasAccessToken: !!data?.access_token,
      tokenLength: data?.access_token?.length || 0,
      responseKeys: Object.keys(data || {})
    });
    
    const { access_token } = data;
    
    if (!access_token) {
      logger.error('[authApi] ❌ Сервер не вернул access_token');
      throw new Error('Сервер не вернул access_token');
    }
    
    logger.log('[authApi] Сохранение токена...');
    await setToken(access_token);
    logger.log('[authApi] ✅ Авторизация успешна, токен сохранен');
    
    return access_token;
  } catch (error: any) {
    logger.error('[authApi] ❌ Ошибка при авторизации:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      stack: error.stack
    });
    throw error;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export async function refreshToken(): Promise<string | null> {
  logger.log('[authApi] Попытка обновить токен...');
  
  if (isRefreshing && refreshPromise) {
    logger.log('[authApi] Уже идет обновление токена, ожидаем...');
    return refreshPromise;
  }

  isRefreshing = true;
  
  refreshPromise = (async () => {
    try {
      logger.log('[authApi] Отправка запроса на refresh...');
      const { data } = await authAxios.post('auth/refresh');
      logger.log('[authApi] Ответ refresh:', {
        hasData: !!data,
        hasAccessToken: !!data?.access_token,
        tokenLength: data?.access_token?.length || 0
      });
      
      const { access_token } = data;
      
      if (access_token) {
        await setToken(access_token);
        logger.log('[authApi] ✅ Токен успешно обновлен');
        return access_token;
      }
      
      logger.warn('[authApi] ⚠️ Refresh не вернул токен');
      return null;
    } catch (err: any) {
      logger.error('[authApi] ❌ Ошибка при обновлении токена:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data
      });
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
