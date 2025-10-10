import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchChats } from '@/services/getChats';

/**
 * Hook для получения чатов с бесконечным скроллом
 */
const useGetChats = (limit: number = 50) => {
  return useInfiniteQuery({
    queryKey: ['chats', limit],
    queryFn: ({ pageParam = 0 }) => fetchChats({ offset: pageParam, limit }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.items) {
        return undefined;
      }
      const currentOffset = lastPage.offset || 0;
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
