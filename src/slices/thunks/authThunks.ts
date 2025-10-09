import { createAsyncThunk } from "@reduxjs/toolkit";
import { authorize } from "../../api/authApi";
import { getToken } from "../../utils/tokenStorage";

export const initAuth = createAsyncThunk(
  "auth/init",
  async (initData: string, { rejectWithValue }) => {
    try {
      console.log('🚀 Инициализация авторизации...');
      const token = await getToken();
      console.log('📦 Токен из хранилища:', token ? 'найден' : 'не найден');

      // Если токена нет - авторизуемся
      if (!token) {
        console.log('➡️ Токена нет, запускаем авторизацию');
        const newToken = await authorize(initData);
        return newToken;
      }

      // Если токен есть - просто возвращаем его
      // Проверка валидности произойдёт автоматически при первом запросе
      // и если получим 401, то interceptor автоматически обновит токен
      console.log('✅ Токен найден, используем его');
      return token;
    } catch (err: any) {
      console.error('❌ Ошибка авторизации:', err);
      return rejectWithValue(err.message || "Ошибка авторизации");
    }
  }
);
