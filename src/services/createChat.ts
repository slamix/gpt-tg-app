import { api } from "@/api/axiosInstance";
import { Chat } from "@/slices/types/types";

export const createChat = async (): Promise<Chat> => {
  const { data } = await api.post<Chat>("chats", { chat_subject: "Новый чат" });
  return data;
};
