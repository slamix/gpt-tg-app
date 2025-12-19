/**
 * Утилита для логирования с поддержкой включения/выключения через переменную окружения
 */

const isDebugEnabled = import.meta.env.VITE_DEBUG_LOGS === 'true' || import.meta.env.DEV;

// Выводим информацию о состоянии логирования при загрузке модуля
console.log(
  `%c[Logger] Логирование ${isDebugEnabled ? 'ВКЛЮЧЕНО' : 'ОТКЛЮЧЕНО'}`,
  `color: ${isDebugEnabled ? '#00ff00' : '#ff0000'}; font-weight: bold; font-size: 14px;`
);
console.log('[Logger] VITE_DEBUG_LOGS:', import.meta.env.VITE_DEBUG_LOGS);
console.log('[Logger] DEV mode:', import.meta.env.DEV);
console.log('[Logger] Mode:', import.meta.env.MODE);

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

