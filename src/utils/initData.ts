import { retrieveLaunchParams } from "@telegram-apps/sdk";

/**
 * Парсит init data из URL (fallback)
 */
function parseInitDataFromUrl(): string | undefined {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    
    let tgWebAppData = urlParams.get('tgWebAppData');
    if (tgWebAppData) {
      return tgWebAppData;
    }
    
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      tgWebAppData = hashParams.get('tgWebAppData');
      if (tgWebAppData) {
        return tgWebAppData;
      }
    }
    
    return undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Получает raw init data из параметров запуска Telegram Mini App
 * @returns {string | undefined} Raw init data строка или undefined если не доступна
 */
export function getInitDataRaw(): string | undefined {
  try {
    const launchParams = retrieveLaunchParams();
    const initDataRaw = launchParams.initDataRaw as string | undefined;
    
    if (initDataRaw) {
      return initDataRaw;
    }
    
    // Fallback to URL parsing
    return parseInitDataFromUrl();
  } catch (error) {
    return parseInitDataFromUrl();
  }
}

/**
 * Получает распарсенный init data из параметров запуска Telegram Mini App
 * @returns {object | undefined} Распарсенный init data объект или undefined если не доступен
 */
export function getInitData() {
  try {
    const launchParams = retrieveLaunchParams();
    return launchParams.initData as any;
  } catch (error) {
    return undefined;
  }
}

