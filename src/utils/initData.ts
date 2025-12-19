import { retrieveLaunchParams } from "@telegram-apps/sdk";
import { logger } from "./logger";

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
    
    if (!initDataRaw) {
      logger.warn('[initData] initDataRaw отсутствует или пустой');
      return undefined;
    }
    
    logger.log('[initData] ✅ Raw init data успешно получен, длина:', initDataRaw.length);
    return initDataRaw;
  } catch (error) {
    logger.error('[initData] ❌ Ошибка при получении init data:', error);
    logger.error('[initData] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return undefined;
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

