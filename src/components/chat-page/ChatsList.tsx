import { useEffect, useState, useRef } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  Chat as ChatIcon,
  MoreVert as MoreVertIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/slices';
import { setActiveChat } from '@/slices/activeChatSlice';
import { getAllChatsFromPages } from '@/services/getChats';
import useGetChats from '@/hooks/useGetChats';
import { useQueryClient } from '@tanstack/react-query';
import { setOpen } from '@/slices/modalSlice';
import { Chat } from '@/slices/types/types';

interface ChatsListProps {
  onMobileClose?: () => void;
}

export function ChatsList({ onMobileClose }: ChatsListProps) {
  const dispatch = useDispatch();
  const activeChatId = useSelector((state: RootState) => state.activeChat.activeChatId);

  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useGetChats(50);

  const allChats = getAllChatsFromPages(data?.pages);

  const [menuAnchor, setMenuAnchor] = useState<{ id: number; el: HTMLElement } | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px', threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleOpen = (method: string, chat: Chat) => {
    setMenuAnchor(null);
    dispatch(setOpen({ method, chat, onCloseSidebar: onMobileClose }));
  }

  if (isLoading) {
    return (
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ flex: 1, p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Ошибка загрузки чатов
        </Alert>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['chats'] })} variant="outlined" fullWidth>
          Попробовать снова
        </Button>
      </Box>
    );
  }

  const handleGetMessages = async (chat: Chat) => {
    dispatch(setActiveChat(chat.id));
    if (onMobileClose) {
      onMobileClose();
    }
   }

  return (
    <>
      {/* Заголовок */}
      <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderBottomColor: 'divider' }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
          Чаты
        </Typography>
      </Box>

      {/* Список */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {allChats.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            p: 4,
            textAlign: 'center'
          }}>
            <ChatIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2, color: 'text.secondary' }} />
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              Чатов пока что нет
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, opacity: 0.7 }}>
            Создайте новый чат, чтобы начать общение.
            </Typography>
          </Box>
        ) : (
          <List sx={{ px: 1 }}>
            {allChats.map((chat) => {
            const isMenuOpen = menuAnchor?.id === chat.id;

            return (
              <ListItem key={chat.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={activeChatId === chat.id}
                  onClick={() => handleGetMessages(chat)}
                  sx={{
                    borderRadius: 2,
                    minHeight: 48,
                    pr: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'secondary.main',
                      color: '#fff',
                    },
                  }}
                >
                  <ChatIcon sx={{ mr: 2, fontSize: 20, opacity: 0.7 }} />
                  <ListItemText
                    primary={chat.chat_subject}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: activeChatId === chat.id ? 600 : 400,
                      noWrap: true,
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAnchor({ id: chat.id, el: e.currentTarget });
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>

                  {/* Меню для конкретного чата */}
                  <Menu
                    anchorEl={menuAnchor?.el}
                    open={isMenuOpen}
                    onClose={() => setMenuAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  >
                    <MenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpen('rename', chat)
                      }}
                    >
                      <ArchiveIcon sx={{ mr: 2, fontSize: 18 }} />
                      Переименовать
                    </MenuItem>
                    <MenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpen('remove', chat)
                      }}
                      sx={{ color: '#ff6b6b' }}
                    >
                      <DeleteIcon sx={{ mr: 2, fontSize: 18 }} />
                      Удалить
                    </MenuItem>
                  </Menu>
                </ListItemButton>
              </ListItem>
            );
          })}

            <div ref={sentinelRef} style={{ height: 1 }} />
            {isFetchingNextPage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={20} />
              </Box>
            )}
          </List>
        )}
      </Box>
    </>
  );
}
