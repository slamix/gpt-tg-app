import { api } from "@/api/axiosInstance";
import { Chat } from "@/slices/types/types";

/**
 * Получает чат по ID
 */
export const getChatById = async (chatId: number): Promise<Chat> => {
  const { data } = await api.get<Chat>(`chats/by-id/${chatId}`);
  return data;
};
