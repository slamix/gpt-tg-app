import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeChat } from '@/services/removeChat';

interface UseRemoveChatParams {
  token: string;
}

interface RemoveChatMutationParams {
  chatId: number;
}

export const useRemoveChat = ({ token }: UseRemoveChatParams) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId }: RemoveChatMutationParams) => 
      removeChat({ chatId, token }),
    onSuccess: () => {
      // Инвалидируем кэш чатов, чтобы обновить список
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};

