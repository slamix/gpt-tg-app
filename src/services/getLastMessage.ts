import { api } from "@/api/axiosInstance";
import { Message } from "./getMessages";

export const getLastMessage = async (chatId: number): Promise<Message> => {
  const { data } = await api.get<Message>(`chats/${chatId}/last-message`);
  return data;
};
