import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createChat } from '@/services/createChat';

interface UseCreateChatParams {
  token: string;
}

export const useCreateChat = ({ token }: UseCreateChatParams) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => createChat({ token }),
    onSuccess: () => {
      // Инвалидируем кэш чатов, чтобы обновить список
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};

