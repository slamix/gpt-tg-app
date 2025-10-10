import { createAsyncThunk } from "@reduxjs/toolkit";
import { authorize } from "../../api/authApi";
import { getToken } from "../../utils/tokenStorage";

export const initAuth = createAsyncThunk(
  "auth/init",
  async (initData: string) => {
    const token = await getToken();

    if (!token) {
      const newToken = await authorize(initData);
      return newToken;
    }

    return token;
  }
);
