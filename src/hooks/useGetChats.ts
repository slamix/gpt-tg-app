import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchChats } from '@/services/getChats';

/**
 * Hook для получения чатов с бесконечным скроллом
 */
const useGetChats = (limit: number = 50, token: string) => {
  return useInfiniteQuery({
    queryKey: ['chats', limit, token], // учитываем токен
    queryFn: ({ pageParam = 0 }) => fetchChats({ offset: pageParam, limit, token }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const currentOffset = lastPage.offset;
      const loadedItems = currentOffset + lastPage.items.length;
      if (lastPage.items.length < lastPage.limit || loadedItems >= lastPage.count) {
        return undefined;
      }
      return loadedItems;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
  });
};

export default useGetChats;
