import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createChat } from '@/services/createChat';

export const useCreateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => createChat(),
    onSuccess: () => {
      // Инвалидируем кэш чатов, чтобы обновить список
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};

