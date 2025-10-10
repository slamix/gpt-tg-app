import { api } from "@/api/axiosInstance";
import { Chat } from "@/slices/types/types";

/**
 * Создаёт новый чат
 */
export const createChat = async (): Promise<Chat> => {
  const { data } = await api.post<Chat>("chats", { chat_subject: "Новый чат" });
  return data;
};
