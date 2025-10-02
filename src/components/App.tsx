import { Navigate, Route, Routes, HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import type { RootState } from "@/slices";
import { authorize } from "@/slices/authSlice";
import { routes } from "@/navigation/routes.tsx";
import { init } from "@/init";
import { retrieveRawInitData } from "@telegram-apps/sdk";
import { ModalRemove } from "@/components/modals/ModalRemove";
import { ModalRename } from "@/components/modals/ModalRename";
import LoadingPage from "@/components/loading-page/LoadingPage";

const queryClient = new QueryClient();

export function App() {
  const dispatch = useDispatch();
  const { token, loading, error } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
    const initializeApp = async () => {
      await init({
        debug: true,
        eruda: true,
        mockForMacOS: true,
      });
    }
    initializeApp();
  }, []);

  useEffect(() => {
    if (!token) {
      const initData = retrieveRawInitData();
      if (initData) {
        dispatch(authorize(initData) as any);
      }
    }
  }, [token]);

  if (loading) return <LoadingPage />;
  if (error) return <div>Ошибка: {error}</div>;

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
      <ModalRemove />
      <ModalRename />
    </QueryClientProvider>
  );
}
