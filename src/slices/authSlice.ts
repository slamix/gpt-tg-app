import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initAuth } from "./thunks/authThunks";
import { logger } from "../utils/logger";

interface AuthState {
  token: string | null;
}

const initialState: AuthState = {
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string | null>) {
      logger.log('[authSlice] setToken вызван:', {
        hasToken: !!action.payload,
        tokenLength: action.payload?.length || 0,
        tokenPreview: action.payload ? action.payload.substring(0, 20) + '...' : 'N/A'
      });
      state.token = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initAuth.pending, (state) => {
        logger.log('[authSlice] initAuth.pending - авторизация в процессе...');
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        logger.log('[authSlice] initAuth.fulfilled - авторизация успешна:', {
          hasToken: !!action.payload,
          tokenLength: action.payload?.length || 0
        });
        state.token = action.payload;
      })
      .addCase(initAuth.rejected, (state, action) => {
        logger.error('[authSlice] initAuth.rejected - авторизация провалилась:', action.error);
      });
  },
});

export const { setToken } = authSlice.actions;
export default authSlice.reducer;
