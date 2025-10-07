import axios from 'axios';
import { Chat } from '@/slices/types/types';

/**
 * API функция для получения чата по ID
 * @param chatId - ID чата
 * @param token - Токен авторизации
 * @returns Promise с данными чата
 */
export const getChatById = async (chatId: number, token: string): Promise<Chat> => {
  const response = await axios.get<Chat>(
    `${import.meta.env.VITE_API_HOST}chats/by-id/${chatId}`,
    {
      headers: { 
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

