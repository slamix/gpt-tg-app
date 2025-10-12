import { api } from "@/api/axiosInstance";

export const removeChat = async (chatId: number): Promise<void> => {
  await api.delete(`chats/${chatId}`);
};
