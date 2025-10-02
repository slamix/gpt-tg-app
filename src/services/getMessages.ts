import axios from 'axios';

// Интерфейс сообщения
export interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp?: string;
}

// Интерфейс ответа API для сообщений
interface GetMessagesResponse {
  items: Message[];
  limit: number;
  offset: number;
  count: number;
}

/**
 * Получает сообщения чата с пагинацией
 * @param chatId - ID чата
 * @param token - Токен авторизации
 * @param offset - Смещение для пагинации
 * @param limit - Количество сообщений за запрос
 * @returns Promise с сообщениями чата
 */
export async function getMessages(
  chatId: number, 
  token: string,
  offset: number = 0,
  limit: number = 50
): Promise<GetMessagesResponse> {
  console.log('получение сообщений началось');
  const response = await axios.get<GetMessagesResponse>(`${import.meta.env.VITE_API_HOST}chats/${chatId}/messages`, {
    params: { offset, limit },
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.data;
}

export default getMessages;
