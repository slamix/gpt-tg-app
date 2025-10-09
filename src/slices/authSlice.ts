import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initAuth } from "./thunks/authThunks";

interface AuthState {
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload;
        state.error = null;
      })
      .addCase(initAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setToken, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;
