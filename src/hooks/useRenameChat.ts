import { useMutation, useQueryClient } from '@tanstack/react-query';
import { renameChat } from '@/services/renameChat';

interface RenameChatMutationParams {
  chatId: number;
  newSubject: string;
}

export const useRenameChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, newSubject }: RenameChatMutationParams) => 
      renameChat(chatId, newSubject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};

