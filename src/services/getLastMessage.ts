import axios from 'axios';
import { Message } from './getMessages';

/**
 * API функция для получения последнего сообщения от модели в чате
 * @param chatId - ID активного чата
 * @param token - Токен авторизации
 * @returns Promise с последним сообщением от модели
 */
export const getLastMessage = async (chatId: number, token: string): Promise<Message> => {
  const response = await axios.get<Message>(
    `${import.meta.env.VITE_API_HOST}chats/${chatId}/last-message`,
    {
      headers: { 
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

