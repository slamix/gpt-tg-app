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
} from '@telegram-apps/sdk-react';

// Флаг для предотвращения повторной инициализации
let isInitialized = false;

/**
 * Initializes the application and configures its dependencies.
 */
export async function init(options: {
  debug: boolean;
  eruda: boolean;
  mockForMacOS: boolean;
}): Promise<void> {
  // Если уже инициализирован - пропускаем
  if (isInitialized) {
    console.log('⚠️ SDK уже инициализирован, пропускаем');
    return;
  }

  console.log('🚀 Инициализируем Telegram SDK...');
  
  // Set @telegram-apps/sdk-react debug mode and initialize it.
  setDebug(options.debug);
  initSDK();

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
      // Игнорируем ошибку если CSS переменные уже привязаны
      console.warn('CSS variables already bound, ignoring');
    }
  }

  mountViewport.isAvailable() && mountViewport().then(() => {
    try {
      bindViewportCssVars();
    } catch (err) {
      // Игнорируем ошибку если CSS переменные уже привязаны
      console.warn('Viewport CSS variables already bound, ignoring');
    }
  });

  // Отмечаем что инициализация завершена
  isInitialized = true;
  console.log('✅ Telegram SDK инициализирован');
}