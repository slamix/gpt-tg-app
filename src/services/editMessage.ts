import { api } from "@/api/axiosInstance";

interface EditMessageParams {
  messageId: number;
  newText: string;
  attachments?: {
    id: number;
    name: string;
    type: string;
    size: number;
    url: string;
  }[];
}

export async function editMessage({ messageId, newText, attachments }: EditMessageParams) {
  if (attachments && attachments.length > 0) {
    await api.patch(`messages/${messageId}/edit`, { text: newText, attachments });
    return;
  }
  await api.patch(`messages/${messageId}/edit`, { text: newText });
};
