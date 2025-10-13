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
import { getToken } from "@/utils/tokenStorage";

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
          debug: false,
          eruda: false,
          mockForMacOS: false,
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
      try {
        const storedToken = await getToken();
        
        if (storedToken) {
          dispatch(setToken(storedToken));
          setIsCheckingAuth(false);
          return;
        }
        
        const initData = retrieveRawInitData();        
        if (initData) {
          dispatch(initAuth(initData) as any);
        } else {
        }
        setIsCheckingAuth(false);
      } catch (err: any) {
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