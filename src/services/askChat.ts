import { api } from "@/api/axiosInstance";

interface AskChatParams {
  chatId: number;
  text: string;
}

interface AskChatResponse {
  id: number;
}

export async function askChat({ chatId, text }: AskChatParams): Promise<AskChatResponse> {
  const { data } = await api.post<AskChatResponse>(`chats/${chatId}/messages`, { text });
  return data;
}
