import {
  setDebug,
  mountBackButton,
  init as initSDK,
  bindThemeParamsCssVars,
  mountViewport,
  bindViewportCssVars,
  mockTelegramEnv,
  type ThemeParams,
  themeParamsState,
  retrieveLaunchParams,
  emitEvent,
  miniApp,
  viewport,
} from '@telegram-apps/sdk-react';
import { logger } from './utils/logger';

let isInitialized = false;

export async function init(options: {
  debug: boolean;
  eruda: boolean;
  mockForMacOS: boolean;
}): Promise<void> {
  logger.log('[init] Начало инициализации SDK...');
  logger.log('[init] Опции:', options);
  
  if (isInitialized) {
    logger.log('[init] SDK уже инициализирован');
    return;
  }
  
  // Set @telegram-apps/sdk-react debug mode and initialize it.
  setDebug(options.debug);
  logger.log('[init] Инициализация SDK...');
  initSDK();
  
  try {
    const launchParams = retrieveLaunchParams();
    const initDataRaw = launchParams.initDataRaw as string | undefined;
    
    logger.log('[init] Launch параметры:', {
      platform: launchParams.tgWebAppPlatform,
      version: launchParams.tgWebAppVersion,
      hasInitDataRaw: !!initDataRaw,
      initDataRawLength: initDataRaw?.length || 0,
      hasInitData: !!launchParams.initData,
      allKeys: Object.keys(launchParams)
    });
  } catch (error) {
    logger.error('[init] ❌ Ошибка при получении launch параметров:', error);
  }

  // Add Eruda if needed.
  options.eruda && void import('eruda').then(({ default: eruda }) => {
    eruda.init();
    eruda.position({ x: window.innerWidth - 50, y: 0 });
  });

  // Telegram for macOS has a ton of bugs, including cases, when the client doesn't
  // even response to the "web_app_request_theme" method. It also generates an incorrect
  // event for the "web_app_request_safe_area" method.
  if (options.mockForMacOS) {
    let firstThemeSent = false;
    mockTelegramEnv({
      onEvent(event, next) {
        if (event[0] === 'web_app_request_theme') {
          let tp: ThemeParams = {};
          if (firstThemeSent) {
            tp = themeParamsState();
          } else {
            firstThemeSent = true;
            tp ||= retrieveLaunchParams().tgWebAppThemeParams;
          }
          return emitEvent('theme_changed', { theme_params: tp });
        }

        if (event[0] === 'web_app_request_safe_area') {
          return emitEvent('safe_area_changed', { left: 0, top: 0, right: 0, bottom: 0 });
        }

        next();
      },
    });
  }

  // Mount all components used in the project.
  mountBackButton.ifAvailable();
  //restoreInitData();
  
  if (miniApp.mountSync.isAvailable()) {
    miniApp.mountSync();
    try {
      bindThemeParamsCssVars();
    } catch (err) {
    }
  }

  mountViewport.isAvailable() && mountViewport().then(() => {
    try {
      bindViewportCssVars();
      if (viewport.expand.isAvailable()) {
        viewport.expand();
      }
    } catch (err) {
      logger.error('[init] Ошибка при настройке viewport:', err);
    }
  });

  isInitialized = true;
  logger.log('[init] ✅ SDK успешно инициализирован');
}