import { retrieveLaunchParams } from "@telegram-apps/sdk";

/**
 * Получает raw init data из параметров запуска Telegram Mini App
 * @returns {string | undefined} Raw init data строка или undefined если не доступна
 */
export function getInitDataRaw(): string | undefined {
  try {
    const { initDataRaw } = retrieveLaunchParams();
    return initDataRaw as string | undefined;
  } catch (error) {
    console.error('Ошибка при получении init data:', error);
    return undefined;
  }
}

/**
 * Получает распарсенный init data из параметров запуска Telegram Mini App
 * @returns {object | undefined} Распарсенный init data объект или undefined если не доступен
 */
export function getInitData() {
  try {
    const { initData } = retrieveLaunchParams();
    return initData;
  } catch (error) {
    console.error('Ошибка при получении init data:', error);
    return undefined;
  }
}

