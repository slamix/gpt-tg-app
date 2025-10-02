import axios from 'axios';

// Параметры для удаления чата
interface RemoveChatParams {
  chatId: number;
  token: string;
}

/**
 * API функция для удаления чата
 */
export const removeChat = async ({ chatId, token }: RemoveChatParams): Promise<void> => {
  await axios.delete(
    `${import.meta.env.VITE_API_HOST}chats/${chatId}`,
    {
      headers: { 
        'Authorization': `Bearer ${token}`,
      },
    }
  );
};
