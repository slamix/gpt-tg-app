/**
 * Утилита для логирования с поддержкой включения/выключения через переменную окружения
 */

const isDebugEnabled = import.meta.env.VITE_DEBUG_LOGS === 'true' || import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDebugEnabled) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDebugEnabled) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Ошибки всегда логируем
    console.error(...args);
  },
  
  info: (...args: any[]) => {
    if (isDebugEnabled) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDebugEnabled) {
      console.debug(...args);
    }
  }
};

// Экспортируем флаг для проверки в других местах
export const isDebugLoggingEnabled = isDebugEnabled;

