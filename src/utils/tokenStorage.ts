import { cloudStorage } from "@telegram-apps/sdk";
import { logger } from "./logger";

export const TOKEN_KEY = "access_token";

export async function getToken(): Promise<string | null> {
  try {
    let token: string | null = null;
    const cloudStorageAvailable = cloudStorage.getItem.isAvailable();
    
    logger.log('[tokenStorage] getToken:', {
      cloudStorageAvailable
    });
    
    if (cloudStorageAvailable) {
      token = await cloudStorage.getItem(TOKEN_KEY);
      logger.log('[tokenStorage] Токен из cloudStorage:', {
        hasToken: !!token,
        tokenLength: token?.length || 0
      });
    } else {
      token = localStorage.getItem(TOKEN_KEY);
      logger.log('[tokenStorage] Токен из localStorage:', {
        hasToken: !!token,
        tokenLength: token?.length || 0
      });
    }
    
    return token ?? null;
  } catch (err) {
    logger.error('[tokenStorage] Ошибка при получении токена из cloudStorage, используем localStorage:', err);
    const token = localStorage.getItem(TOKEN_KEY);
    return token;
  }
}

export async function setToken(token: string): Promise<void> {
  logger.log('[tokenStorage] setToken вызван:', {
    tokenLength: token?.length || 0,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'N/A'
  });
  
  try {
    const cloudStorageAvailable = cloudStorage.setItem.isAvailable();
    
    if (cloudStorageAvailable) {
      await cloudStorage.setItem(TOKEN_KEY, token);
      logger.log('[tokenStorage] ✅ Токен сохранен в cloudStorage');
    } else {
      localStorage.setItem(TOKEN_KEY, token);
      logger.log('[tokenStorage] ✅ Токен сохранен в localStorage');
    }
  } catch (err) {
    logger.error('[tokenStorage] ❌ Ошибка при сохранении в cloudStorage, используем localStorage:', err);
    localStorage.setItem(TOKEN_KEY, token);
    logger.log('[tokenStorage] ✅ Токен сохранен в localStorage (fallback)');
  }
}

export async function removeToken(): Promise<void> {
  logger.log('[tokenStorage] removeToken вызван');
  
  try {
    const cloudStorageAvailable = cloudStorage.deleteItem.isAvailable();
    
    if (cloudStorageAvailable) {
      await cloudStorage.deleteItem(TOKEN_KEY);
      logger.log('[tokenStorage] ✅ Токен удален из cloudStorage');
    } else {
      localStorage.removeItem(TOKEN_KEY);
      logger.log('[tokenStorage] ✅ Токен удален из localStorage');
    }
  } catch (err) {
    logger.error('[tokenStorage] ❌ Ошибка при удалении из cloudStorage, используем localStorage:', err);
    localStorage.removeItem(TOKEN_KEY);
    logger.log('[tokenStorage] ✅ Токен удален из localStorage (fallback)');
  }
}
