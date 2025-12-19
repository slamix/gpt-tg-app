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

// Добавляем логирование для отладки
authAxios.interceptors.request.use(
  (config) => {
    logger.log('[authAxios] 📤 Исходящий запрос:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      withCredentials: config.withCredentials,
      headers: config.headers,
      hasData: !!config.data
    });
    return config;
  },
  (error) => {
    logger.error('[authAxios] ❌ Ошибка перед отправкой:', error);
    return Promise.reject(error);
  }
);

authAxios.interceptors.response.use(
  (response) => {
    logger.log('[authAxios] ✅ Ответ получен:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      hasData: !!response.data
    });
    return response;
  },
  (error) => {
    logger.error('[authAxios] ❌ Ошибка ответа:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      }
    });
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
  logger.log('[authApi] Отправка запроса на авторизацию...');
  logger.log('[authApi] API URL:', API_URL);
  logger.log('[authApi] Метод отправки:', USE_HEADER_AUTH ? 'Authorization header' : 'Request body');
  logger.log('[authApi] Init data:', {
    hasInitData: !!initData,
    initDataLength: initData?.length || 0,
    initDataPreview: initData?.substring(0, 100) + '...'
  });
  
  try {
    let response;
    
    logger.log('[authApi] Подготовка запроса:', {
      baseURL: authAxios.defaults.baseURL,
      url: 'auth/telegram',
      fullURL: `${authAxios.defaults.baseURL}auth/telegram`,
      withCredentials: authAxios.defaults.withCredentials,
      headers: authAxios.defaults.headers
    });
    
    if (USE_HEADER_AUTH) {
      // Метод 1: Отправка в заголовке (рекомендация Telegram Mini Apps)
      logger.log('[authApi] Отправка init data в заголовке Authorization...');
      response = await authAxios.post('auth/telegram', {}, {
        headers: {
          'Authorization': `tma ${initData}`
        }
      });
    } else {
      // Метод 2: Отправка в теле запроса (текущий метод)
      logger.log('[authApi] Отправка init data в теле запроса...');
      logger.log('[authApi] Payload:', {
        hasInitData: !!initData,
        initDataLength: initData.length
      });
      
      response = await authAxios.post('auth/telegram', { initData });
    }
    
    const { data } = response;
    
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
      requestMethod: USE_HEADER_AUTH ? 'header' : 'body',
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
