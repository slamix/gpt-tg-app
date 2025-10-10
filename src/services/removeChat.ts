import { api } from "@/api/axiosInstance";

/**
 * Удаляет чат
 */
export const removeChat = async (chatId: number): Promise<void> => {
  await api.delete(`chats/${chatId}`);
};
