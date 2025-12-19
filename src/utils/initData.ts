import { retrieveLaunchParams } from "@telegram-apps/sdk";
import { logger } from "./logger";

/**
 * Парсит init data из URL (fallback)
 */
function parseInitDataFromUrl(): string | undefined {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    
    logger.log('[initData] Fallback: парсинг URL:', {
      search: window.location.search.substring(0, 100),
      hash: hash.substring(0, 100)
    });
    
    // Проверяем query
    let tgWebAppData = urlParams.get('tgWebAppData');
    if (tgWebAppData) {
      logger.log('[initData] ✅ Найден в URL query');
      return tgWebAppData;
    }
    
    // Проверяем hash
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      tgWebAppData = hashParams.get('tgWebAppData');
      if (tgWebAppData) {
        logger.log('[initData] ✅ Найден в URL hash');
        return tgWebAppData;
      }
    }
    
    logger.warn('[initData] tgWebAppData не найден в URL');
    return undefined;
  } catch (error) {
    logger.error('[initData] Ошибка парсинга URL:', error);
    return undefined;
  }
}

/**
 * Получает raw init data из параметров запуска Telegram Mini App
 * @returns {string | undefined} Raw init data строка или undefined если не доступна
 */
export function getInitDataRaw(): string | undefined {
  logger.log('[initData] Попытка получить raw init data...');
  
  try {
    const launchParams = retrieveLaunchParams();
    const initDataRaw = launchParams.initDataRaw as string | undefined;
    
    logger.log('[initData] Launch params получены:', {
      hasInitDataRaw: !!initDataRaw,
      initDataRawLength: initDataRaw?.length || 0,
      initDataRawPreview: initDataRaw ? initDataRaw.substring(0, 50) + '...' : 'N/A',
      allKeys: Object.keys(launchParams)
    });
    
    if (initDataRaw) {
      logger.log('[initData] ✅ Raw init data из SDK, длина:', initDataRaw.length);
      return initDataRaw;
    }
    
    // Fallback
    logger.warn('[initData] SDK не вернул initDataRaw, пробуем fallback...');
    const fallbackData = parseInitDataFromUrl();
    
    if (fallbackData) {
      logger.log('[initData] ✅ Raw init data из URL (fallback), длина:', fallbackData.length);
      return fallbackData;
    }
    
    logger.error('[initData] ❌ Init data не найден');
    return undefined;
  } catch (error) {
    logger.error('[initData] ❌ Ошибка при получении init data:', error);
    logger.error('[initData] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return parseInitDataFromUrl();
  }
}

/**
 * Получает распарсенный init data из параметров запуска Telegram Mini App
 * @returns {object | undefined} Распарсенный init data объект или undefined если не доступен
 */
export function getInitData() {
  logger.log('[initData] Попытка получить распарсенный init data...');
  
  try {
    const launchParams = retrieveLaunchParams();
    const initData = launchParams.initData as any;
    
    logger.log('[initData] Init data получен:', {
      hasInitData: !!initData,
      initDataKeys: initData ? Object.keys(initData) : [],
      userId: initData?.user?.id,
      authDate: initData?.authDate
    });
    
    return initData;
  } catch (error) {
    logger.error('[initData] ❌ Ошибка при получении распарсенного init data:', error);
    return undefined;
  }
}

