import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  List,
  ListItem,
  Paper,
  CircularProgress,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/slices';
import { getMessages } from '@/services/getMessages';
import { addMessages, addMessage } from '@/slices/messagesSlice';
import { getLastMessage } from '@/services/getLastMessage';
import { setNotWaitingMsg } from '@/slices/waitingMsgSlice';

interface ChatWindowProps {
  onScrollDirectionChange?: (isScrollingDown: boolean) => void;
}

export function ChatWindow({ onScrollDirectionChange }: ChatWindowProps) {
  const dispatch = useDispatch();
  const messages = useSelector((state: RootState) => state.messages.messages);
  const { activeChatId, isNewChat } = useSelector((state: RootState) => state.activeChat);
  const token = useSelector((state: RootState) => state.auth.token);
  const isWaitingMsg = useSelector((state: RootState) => state.waitingMsg.isWaitingMsg);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChatId || isNewChat) return;
      setIsLoading(true);
      try {
        const { items } = await getMessages(activeChatId, token as string);
        dispatch(addMessages(items));
      } catch (error) {
        console.log('Ошибка получения сообщений:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMessages();
  }, [activeChatId, dispatch]);

  useEffect(() => {
    const fetchNewMessage = async () => {
      if (!isWaitingMsg || !activeChatId) return;
      
      try {
        const res = await getLastMessage(activeChatId, token as string);
        console.log('Получено сообщение от модели:', res);
        dispatch(addMessage(res));
      } catch (error) {
        console.error('Ошибка при получении сообщения:', error);
      } finally {
        // Сбрасываем флаг ожидания после получения сообщения
        dispatch(setNotWaitingMsg());
      }
    }
    fetchNewMessage();
  }, [isWaitingMsg, activeChatId, token, dispatch]);

  // Автоматический скролл при изменении сообщений
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages]);

  // Отслеживание направления скролла
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onScrollDirectionChange) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const isScrollingDown = scrollTop > lastScrollTop.current;
      
      // Обновляем только если направление изменилось и скролл больше порога
      if (Math.abs(scrollTop - lastScrollTop.current) > 5) {
        onScrollDirectionChange(isScrollingDown);
        lastScrollTop.current = scrollTop;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onScrollDirectionChange]);

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        overflow: 'auto',
        p: 1,
        pt: '70px', // Отступ сверху для плавающего хедера
        pb: '140px', // Отступ снизу для формы ввода
        backgroundColor: 'background.default',
        scrollBehavior: 'smooth',
        position: 'relative',
      }}
    >
      {/* Индикатор загрузки */}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'background.default',
            zIndex: 10,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              display: 'inline-flex',
            }}
          >
            {/* Внешнее кольцо */}
            <CircularProgress
              size={60}
              thickness={2}
              sx={{
                color: 'secondary.main',
                opacity: 0.3,
                position: 'absolute',
              }}
              variant="determinate"
              value={100}
            />
            {/* Вращающееся кольцо */}
            <CircularProgress
              size={60}
              thickness={2}
              sx={{
                color: 'secondary.main',
                animationDuration: '1.2s',
              }}
            />
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 3,
              fontSize: '0.875rem',
              fontWeight: 500,
              letterSpacing: '0.5px',
            }}
          >
            Загрузка сообщений...
          </Typography>
        </Box>
      )}

      {/* Контент сообщений */}
      {!isLoading && (
        <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2 } }}>
          <List sx={{ py: 1 }}>
            {messages && Array.isArray(messages) && activeChatId !== null ? (
              <>
                {messages.map((message, index) => {
                  // Четный индекс (0, 2, 4...) = пользователь, нечетный = модель
                  const isUser = index % 2 === 0;
                  
                  return (
                    <ListItem
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: isUser ? 'flex-end' : 'flex-start',
                        mb: 1,
                        px: 0,
                        animation: 'fadeInUp 0.4s ease-out',
                        '@keyframes fadeInUp': {
                          '0%': {
                            opacity: 0,
                            transform: 'translateY(20px)',
                          },
                          '100%': {
                            opacity: 1,
                            transform: 'translateY(0)',
                          },
                        },
                      }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          background: isUser 
                            ? 'linear-gradient(135deg, #4299E1 0%, #3182CE 100%)'
                            : 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)',
                          borderRadius: isUser ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                          maxWidth: '80%',
                          wordBreak: 'break-word',
                          border: '1px solid',
                          borderColor: isUser ? 'rgba(66, 153, 225, 0.3)' : 'rgba(45, 55, 72, 0.5)',
                          boxShadow: isUser 
                            ? '0 4px 12px rgba(66, 153, 225, 0.25)'
                            : '0 2px 8px rgba(0, 0, 0, 0.2)',
                          position: 'relative',
                          '&::before': isUser ? {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                            borderRadius: 'inherit',
                            pointerEvents: 'none',
                          } : {},
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{ 
                            lineHeight: 1.5,
                            fontSize: '0.95rem',
                            color: isUser ? '#ffffff' : 'text.primary',
                            position: 'relative',
                            zIndex: 1,
                          }}
                        >
                          {message.text}
                        </Typography>
                      </Paper>
                    </ListItem>
                  );
                })}
                {/* Невидимый элемент для автоскролла */}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Чем могу помочь?
                </Typography>
              </Box>
            )}
          </List>
        </Container>
      )}
    </Box>
  );
}
