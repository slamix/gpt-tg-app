import { createAsyncThunk } from "@reduxjs/toolkit";
import { authorize } from "../../api/authApi";
import { getToken } from "../../utils/tokenStorage";
import { logger } from "../../utils/logger";

export const initAuth = createAsyncThunk(
  "auth/init",
  async (initData: string) => {
    const token = await getToken();

    if (!token) {
      try {
        const newToken = await authorize(initData);
        return newToken;
      } catch (error) {
        logger.error('[DEBUG] Auth init error:', error);
        throw error;
      }
    }

    return token;
  }
);
