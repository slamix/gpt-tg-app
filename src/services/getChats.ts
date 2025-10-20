import { api } from '@/api/axiosInstance';
import { Chat } from '@/slices/types/types';

export interface GetChatsResponse {
  items: Chat[];
  limit: number;
  offset: number;
  count: number;
}

interface GetChatsParams {
  offset?: number;
  limit?: number;
}

export const fetchChats = async (params: GetChatsParams = {}): Promise<GetChatsResponse> => {
  const { offset = 0, limit = 50 } = params;
  const { data } = await api.get<GetChatsResponse>("chats", {
    params: { offset, limit },
  });
  return data;
};

export const getAllChatsFromPages = (pages: GetChatsResponse[] | undefined): Chat[] => {
  if (!pages || pages.length === 0) return [];
  return pages.reduce((allChats: Chat[], page) => {
    if (!page || !page.items) return allChats;
    return [...allChats, ...page.items];
  }, []);
};

export const getTotalChatsCount = (pages: GetChatsResponse[] | undefined): number => {
  if (!pages || pages.length === 0) return 0;
  return pages[0].count;
};
