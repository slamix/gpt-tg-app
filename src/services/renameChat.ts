import { api } from "@/api/axiosInstance";
import { Chat } from "@/slices/types/types";

export const renameChat = async (chatId: number, newSubject: string): Promise<Chat> => {
  const { data } = await api.patch<Chat>(`chats/${chatId}/subject`, {
    chat_subject: newSubject,
  });
  return data;
};
