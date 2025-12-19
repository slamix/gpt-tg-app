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
      logger.log('[DEBUG] Token set in Redux');
      state.token = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initAuth.pending, () => {
        logger.log('[DEBUG] Auth pending');
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        logger.log('[DEBUG] Auth successful');
        state.token = action.payload;
      })
      .addCase(initAuth.rejected, (_state, action) => {
        logger.error('[DEBUG] Auth failed:', action.error);
      });
  },
});

export const { setToken } = authSlice.actions;
export default authSlice.reducer;
