import { useEffect, useState } from "react";
import { Navigate, Route, Routes, HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/slices";
import { initAuth } from "@/slices/thunks/authThunks";
import { setToken } from "@/slices/authSlice";
import { init } from "@/init";
import { retrieveRawInitData } from "@telegram-apps/sdk";
import { routes } from "@/navigation/routes";
import { ModalRemove } from "@/components/modals/ModalRemove";
import { ModalRename } from "@/components/modals/ModalRename";

// react-query клиент
const queryClient = new QueryClient();

export function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state: RootState) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 1️⃣ Инициализация Telegram SDK и окружения
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
        setIsInitialized(true); // Всё равно продолжаем
      }
    };
    initializeApp();
  }, [dispatch]);

  // 2️⃣ Проверяем токен в хранилище и запускаем авторизацию только если его нет
  useEffect(() => {
    if (!isInitialized) return;

    const checkAuthAndInit = async () => {
      try {
        const { getToken } = await import('@/utils/tokenStorage');
        const storedToken = await getToken();
        
        if (storedToken) {
          dispatch(setToken(storedToken));
          setIsCheckingAuth(false);
          return;
        }
        
        const initData = retrieveRawInitData();
        
        if (initData) {
          dispatch(initAuth(initData) as any);
        }
        setIsCheckingAuth(false);
      } catch (err: any) {
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndInit();
  }, [isInitialized, dispatch]);

  // 3️⃣ Основной рендер приложения
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
