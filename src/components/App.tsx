import { useEffect, useState } from "react";
import { Navigate, Route, Routes, HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/slices";
import { initAuth } from "@/slices/thunks/authThunks";
import { setToken } from "@/slices/authSlice";
import { init } from "@/init";
import { getInitDataRaw } from "@/utils/initData";
import { routes } from "@/navigation/routes";
import { ModalRemove } from "@/components/modals/ModalRemove";
import { ModalRename } from "@/components/modals/ModalRename";
import { getToken } from "@/utils/tokenStorage";
import { logger } from "@/utils/logger";

const queryClient = new QueryClient();

export function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state: RootState) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await init({
          debug: true,
          eruda: true,
          mockForMacOS: true,
        });
        setIsInitialized(true);
      } catch (err: any) {
        setIsInitialized(true);
      }
    };
    initializeApp();
  }, [dispatch]);

  useEffect(() => {
    if (!isInitialized) return;

    const checkAuthAndInit = async () => {
      logger.log('[App] Начало проверки авторизации...');
      
      try {
        const storedToken = await getToken();
        logger.log('[App] Проверка сохраненного токена:', {
          hasToken: !!storedToken,
          tokenLength: storedToken?.length || 0
        });
        
        if (storedToken) {
          logger.log('[App] ✅ Найден сохраненный токен, используем его');
          dispatch(setToken(storedToken));
          setIsCheckingAuth(false);
          return;
        }
        
        logger.log('[App] Сохраненный токен не найден, получаем init data...');
        const initDataRaw = getInitDataRaw();
        
        logger.log('[App] Результат получения init data:', {
          hasInitData: !!initDataRaw,
          initDataLength: initDataRaw?.length || 0
        });
        
        if (initDataRaw) {
          logger.log('[App] ✅ Init data получен, отправляем запрос на авторизацию...');
          dispatch(initAuth(initDataRaw) as any);
        } else {
          logger.warn('[App] ⚠️ Init data не получен, авторизация невозможна');
        }
        setIsCheckingAuth(false);
      } catch (err: any) {
        logger.error('[App] ❌ Ошибка при проверке авторизации:', err);
        logger.error('[App] Stack trace:', err.stack);
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndInit();
  }, [isInitialized, dispatch]);

  if (isCheckingAuth) {
    return null;
  }
  
  if (!token) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} {...route} />
          ))}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>

      {/* Глобальные модалки */}
      <ModalRemove />
      <ModalRename />
    </QueryClientProvider>
  );
}