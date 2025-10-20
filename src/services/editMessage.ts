import { api } from "@/api/axiosInstance";

interface EditMessageParams {
  messageId: number;
  newText: string;
}

export async function editMessage({messageId, newText }: EditMessageParams) {
  const { data } = await api.patch(`messages/${messageId}/edit`, { text: newText });
  return data;
};
