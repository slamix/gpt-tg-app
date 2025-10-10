import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initAuth } from "./thunks/authThunks";

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
      state.token = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initAuth.fulfilled, (state, action) => {
        state.token = action.payload;
      });
  },
});

export const { setToken } = authSlice.actions;
export default authSlice.reducer;
