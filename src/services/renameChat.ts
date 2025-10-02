import axios from 'axios';
import { Chat } from '@/slices/types/types';

// Параметры для переименования чата
interface RenameChatParams {
  chatId: number;
  newSubject: string;
  token: string;
}

/**
 * API функция для переименования чата
 */
export const renameChat = async ({ chatId, newSubject, token }: RenameChatParams): Promise<Chat> => {
  console.log(newSubject)
  const response = await axios.patch<Chat>(
    `${import.meta.env.VITE_API_HOST}chats/${chatId}/subject`,
    {
      chat_subject: newSubject,
    },
    {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};
