import { api } from "@/api/axiosInstance";
import { Message } from "./getMessages";

/**
 * Получает последнее сообщение в чате
 */
export const getLastMessage = async (chatId: number): Promise<Message> => {
  const { data } = await api.get<Message>(`chats/${chatId}/last-message`);
  return data;
};
