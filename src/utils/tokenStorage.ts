import { cloudStorage } from "@telegram-apps/sdk";

export const TOKEN_KEY = "access_token";

export async function getToken(): Promise<string | null> {
  try {
    if (cloudStorage.getItem.isAvailable()) {
      const token = await cloudStorage.getItem(TOKEN_KEY);
      return token ?? null;
    }
    return localStorage.getItem(TOKEN_KEY);
  } catch (err) {
    return localStorage.getItem(TOKEN_KEY);
  }
}

export async function setToken(token: string): Promise<void> {
  try {
    if (cloudStorage.setItem.isAvailable()) {
      await cloudStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (err) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export async function removeToken(): Promise<void> {
  try {
    if (cloudStorage.deleteItem.isAvailable()) {
      await cloudStorage.deleteItem(TOKEN_KEY);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    localStorage.removeItem(TOKEN_KEY);
  }
}
