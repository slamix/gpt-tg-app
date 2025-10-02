import axios from 'axios';
import { Chat } from '@/slices/types/types';

// Параметры для создания чата
interface CreateChatParams {
  token: string;
}

/**
 * API функция для создания нового чата
 */
export const createChat = async ({ token }: CreateChatParams): Promise<Chat> => {
  const response = await axios.post<Chat>(
    `${import.meta.env.VITE_API_HOST}chats`,
    { chat_subject: 'Новый чат' },
    {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

