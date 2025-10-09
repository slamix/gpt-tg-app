import { useEffect, useState } from "react";
import { Navigate, Route, Routes, HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/slices";
import { initAuth } from "@/slices/thunks/authThunks";
import { setError, setToken } from "@/slices/authSlice";
import { init } from "@/init";
import { retrieveRawInitData } from "@telegram-apps/sdk";
import { routes } from "@/navigation/routes";
import { ModalRemove } from "@/components/modals/ModalRemove";
import { ModalRename } from "@/components/modals/ModalRename";
import LoadingPage from "@/pages/LoadingPage";
import ErrorPage from "@/pages/ErrorPage";

// react-query клиент
const queryClient = new QueryClient();

export function App() {
  const dispatch = useDispatch();
  const { token, loading, error } = useSelector((state: RootState) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

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
        dispatch(setError(err.message || 'Ошибка инициализации'));
      }
    };
    initializeApp();
  }, [dispatch]);

  // 2️⃣ Проверяем токен и запускаем авторизацию только если его нет
  useEffect(() => {
    if (!isInitialized) return;

    const checkAuthAndInit = async () => {
      try {
        // Импортируем getToken здесь чтобы избежать циклических зависимостей
        const { getToken } = await import('@/utils/tokenStorage');
        const storedToken = await getToken();
        
        console.log('🔍 Проверяем токен в хранилище:', storedToken ? 'НАЙДЕН' : 'НЕТ');
        
        if (storedToken) {
          // Токен есть - загружаем его в Redux и используем
          console.log('✅ Токен найден в хранилище, загружаем в state');
          dispatch(setToken(storedToken));
          return;
        }
        
        // Токена нет - нужна первичная авторизация через initData
        console.log('❌ Токена нет, требуется первичная авторизация');
        const initData = retrieveRawInitData();
        console.log('📱 initData:', initData ? 'получены' : 'НЕ получены');
        
        if (initData) {
          console.log('➡️ Запускаем первичную авторизацию через initData...');
          dispatch(initAuth(initData) as any);
        } else {
          console.error("❌ initData не найдена — отсутствует контекст Telegram WebApp");
          dispatch(setError("Приложение должно запускаться в Telegram"));
        }
      } catch (err: any) {
        console.error('❌ Ошибка при проверке авторизации:', err);
        dispatch(setError(err.message || 'Ошибка авторизации'));
      }
    };

    checkAuthAndInit();
  }, [isInitialized, dispatch]);

  // 3️⃣ Защита от бесконечного loading (таймаут 10 секунд)
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.error('⏰ Таймаут авторизации - прошло более 10 секунд');
        dispatch(setError('Превышено время ожидания авторизации'));
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [loading, dispatch]);

  // 4️⃣ Загрузочное и ошибочное состояние
  console.log('🎨 Состояние рендера:', { loading, error: !!error, token: !!token, isInitialized });
  
  // Показываем загрузку пока инициализируется или авторизуется
  if (!isInitialized || loading) {
    console.log('⏳ Показываем LoadingPage');
    return <LoadingPage />;
  }
  
  // Показываем ошибку если есть
  if (error) {
    console.log('❌ Показываем ErrorPage:', error);
    return <ErrorPage error={error} />;
  }

  // Если токена нет - показываем загрузку (ждём результата авторизации)
  if (!token) {
    console.log('⏳ Ждём токен...');
    return <LoadingPage />;
  }

  // 5️⃣ Основной рендер приложения
  console.log('✅ Рендерим основное приложение');
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
