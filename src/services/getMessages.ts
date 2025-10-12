import { api } from "@/api/axiosInstance";

export interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp?: string;
}

interface GetMessagesResponse {
  items: Message[];
  limit: number;
  offset: number;
  count: number;
}

export async function getMessages(
  chatId: number,
  offset: number = 0,
  limit: number = 50
): Promise<GetMessagesResponse> {
  const { data } = await api.get<GetMessagesResponse>(`chats/${chatId}/messages`, {
    params: { offset, limit },
  });
  return data;
}

export default getMessages;
