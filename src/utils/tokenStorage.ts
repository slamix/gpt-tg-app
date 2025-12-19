import { cloudStorage } from "@telegram-apps/sdk";
import { logger } from "./logger";

export const TOKEN_KEY = "access_token";

export async function getToken(): Promise<string | null> {
  try {
    let token: string | null = null;
    const cloudStorageAvailable = cloudStorage.getItem.isAvailable();
    
    if (cloudStorageAvailable) {
      token = await cloudStorage.getItem(TOKEN_KEY);
    } else {
      token = localStorage.getItem(TOKEN_KEY);
    }
    
    return token ?? null;
  } catch (err) {
    const token = localStorage.getItem(TOKEN_KEY);
    return token;
  }
}

export async function setToken(token: string): Promise<void> {
  logger.log('[DEBUG] Token saved');
  
  try {
    const cloudStorageAvailable = cloudStorage.setItem.isAvailable();
    
    if (cloudStorageAvailable) {
      await cloudStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (err) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export async function removeToken(): Promise<void> {
  logger.log('[DEBUG] Token removed');
  
  try {
    const cloudStorageAvailable = cloudStorage.deleteItem.isAvailable();
    
    if (cloudStorageAvailable) {
      await cloudStorage.deleteItem(TOKEN_KEY);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    localStorage.removeItem(TOKEN_KEY);
  }
}
