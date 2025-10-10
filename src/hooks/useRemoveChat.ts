import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeChat } from '@/services/removeChat';


export const useRemoveChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId }: { chatId: number}) => 
      removeChat(chatId),
    onSuccess: () => {
      // Инвалидируем кэш чатов, чтобы обновить список
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};

