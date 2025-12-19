import { createAsyncThunk } from "@reduxjs/toolkit";
import { authorize } from "../../api/authApi";
import { getToken } from "../../utils/tokenStorage";
import { logger } from "../../utils/logger";

export const initAuth = createAsyncThunk(
  "auth/init",
  async (initData: string) => {
    logger.log('[authThunks] Начало инициализации авторизации...');
    logger.log('[authThunks] Init data:', {
      hasInitData: !!initData,
      initDataLength: initData?.length || 0,
      initDataPreview: initData?.substring(0, 100) + '...'
    });
    
    const token = await getToken();
    logger.log('[authThunks] Проверка существующего токена:', {
      hasToken: !!token,
      tokenLength: token?.length || 0
    });

    if (!token) {
      logger.log('[authThunks] Токен не найден, отправляем запрос на авторизацию...');
      try {
        const newToken = await authorize(initData);
        logger.log('[authThunks] Результат авторизации:', {
          hasToken: !!newToken,
          tokenLength: newToken?.length || 0
        });
        
        if (newToken) {
          logger.log('[authThunks] ✅ Успешная авторизация, токен получен');
        } else {
          logger.error('[authThunks] ❌ Авторизация не вернула токен');
        }
        
        return newToken;
      } catch (error) {
        logger.error('[authThunks] ❌ Ошибка при авторизации:', error);
        throw error;
      }
    }

    logger.log('[authThunks] ✅ Используем существующий токен');
    return token;
  }
);
