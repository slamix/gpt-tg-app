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
        console.error('❌ Ошибка инициализации SDK:', err);
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
        console.log('🔍 Проверяем токен в хранилище...');
        const { getToken } = await import('@/utils/tokenStorage');
        const storedToken = await getToken();
        
        if (storedToken) {
          // Токен найден в хранилище - загружаем в Redux
          console.log('✅ Токен найден в хранилище, загружаем в state');
          dispatch(setToken(storedToken));
          setIsCheckingAuth(false);
          return;
        }
        
        // Токена нет - нужна первичная авторизация через initData
        console.log('⚠️ Токен НЕ найден в хранилище, требуется первичная авторизация');
        const initData = retrieveRawInitData();
        console.log('📱 initData:', initData ? 'получены' : 'НЕ получены');
        
        if (initData) {
          console.log('🔐 Запускаем первичную авторизацию через /auth/telegram...');
          dispatch(initAuth(initData) as any);
        } else {
          console.error("❌ initData не найдены — отсутствует контекст Telegram WebApp");
        }
        setIsCheckingAuth(false);
      } catch (err: any) {
        console.error('❌ Ошибка при проверке авторизации:', err);
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndInit();
  }, [isInitialized, dispatch]);

  // 3️⃣ Основной рендер приложения
  console.log('🎨 Состояние рендера:', { token: !!token, isInitialized, isCheckingAuth });
  
  // Пока проверяем токен - показываем пустой экран
  if (isCheckingAuth) {
    return null;
  }
  
  // Если токена нет - показываем пустой экран
  if (!token) {
    return null;
  }

  console.log('✅ Токен есть, рендерим приложение');
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
