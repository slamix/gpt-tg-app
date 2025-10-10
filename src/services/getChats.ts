import { api } from '@/api/axiosInstance';
import { Chat } from '@/slices/types/types';

// Интерфейс ответа от API
export interface GetChatsResponse {
  items: Chat[];
  limit: number;
  offset: number;
  count: number;
}

// Параметры запроса
interface GetChatsParams {
  offset?: number;
  limit?: number;
}

/**
 * API функция для получения чатов с пагинацией
 */
export const fetchChats = async (params: GetChatsParams = {}): Promise<GetChatsResponse> => {
  const { offset = 0, limit = 50 } = params;
  const { data } = await api.get<GetChatsResponse>("user/chats", {
    params: { offset, limit },
  });
  return data;
};

/**
 * Утилита для получения всех чатов из страниц
 */
export const getAllChatsFromPages = (pages: GetChatsResponse[] | undefined): Chat[] => {
  if (!pages || pages.length === 0) return [];
  return pages.reduce((allChats: Chat[], page) => {
    if (!page || !page.items) return allChats;
    return [...allChats, ...page.items];
  }, []);
};

/**
 * Утилита для получения общего количества чатов
 */
export const getTotalChatsCount = (pages: GetChatsResponse[] | undefined): number => {
  if (!pages || pages.length === 0) return 0;
  return pages[0].count;
};
