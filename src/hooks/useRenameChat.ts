import { useMutation, useQueryClient } from '@tanstack/react-query';
import { renameChat } from '@/services/renameChat';

interface UseRenameChatParams {
  token: string;
}

interface RenameChatMutationParams {
  chatId: number;
  newSubject: string;
}

export const useRenameChat = ({ token }: UseRenameChatParams) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, newSubject }: RenameChatMutationParams) => 
      renameChat({ chatId, newSubject, token }),
    onSuccess: () => {
      // Инвалидируем кэш чатов, чтобы обновить список
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};

