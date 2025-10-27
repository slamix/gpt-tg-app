import { api } from "@/api/axiosInstance";

interface AskChatParams {
  chatId: number;
  text: string;
  attachments?: {
    id: number;
    name: string;
    type: string;
    size: number;
    url: string;
  }[];
}

interface AskChatResponse {
  id: number;
}

export async function askChat({ chatId, text, attachments }: AskChatParams): Promise<AskChatResponse> {
  if (attachments && attachments.length > 0) {
    const { data } = await api.post<AskChatResponse>(`chats/${chatId}/messages`, { text, attachments });
    return data;
  }
  const { data } = await api.post<AskChatResponse>(`chats/${chatId}/messages`, { text });
  return data;
}
