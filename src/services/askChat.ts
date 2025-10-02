import axios from 'axios';

// Интерфейс данных формы (соответствует MessageInput.tsx)
/* interface MessageFormData {
  message: string;
} */

// Интерфейс для полных данных запроса
interface AskChatParams {
  chatId: number;
  text: string;
  // TODO: Раскомментировать когда API для файлов будет готово
  // files?: File[];
}


// Интерфейс ответа от API
interface AskChatResponse {
  id: number;
}

/**
 * Отправляет сообщение в чат с данными из react-hook-form
 * @param params - Объект с параметрами запроса
 * @param params.chatId - ID чата
 * @param params.formData - Данные формы из react-hook-form
 * @param params.token - Токен авторизации
 * @returns Promise с ответом от сервера
 */
export async function askChat({ chatId, text, token }: AskChatParams & { token: string }): Promise<AskChatResponse> {
  const response = await axios.post<AskChatResponse>( `${import.meta.env.VITE_API_HOST}chats/${chatId}/messages`, {
    text
    }, 
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    }
  );

  return response.data;
}
