import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { cloudStorage } from "@telegram-apps/sdk";
import axios from "axios";
import { AbortablePromise } from "@telegram-apps/sdk-react";

export const TOKEN_KEY = "token";

export type AuthState = {
  token: AbortablePromise<string> | string |null;
  loading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  token: cloudStorage.getItem.isAvailable() ? cloudStorage.getItem(TOKEN_KEY) : null,
  loading: false,
  error: null,
};

// thunk для авторизации
export const authorize = createAsyncThunk<string, string, { rejectValue: string }>(
  "auth/authorize",
  async (initData, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_HOST}auth/telegram/webapp`,{
        initData
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const { access_token } = res.data;

      // сохраняем токен в cloudStorage
      if (cloudStorage.setItem.isAvailable()) {
        await cloudStorage.setItem(TOKEN_KEY, access_token);
      }

      return access_token as string;
    } catch (e: any) {
      console.log(e);
      return rejectWithValue(e.message || "Auth failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(authorize.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(authorize.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload;
        console.log(state.token);
      })
      .addCase(authorize.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default authSlice.reducer;
