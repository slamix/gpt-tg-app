import { api } from "@/api/axiosInstance";
import { Chat } from "@/slices/types/types";

export const getChatById = async (chatId: number): Promise<Chat> => {
  const { data } = await api.get<Chat>(`chats/${chatId}`);
  return data;
};
