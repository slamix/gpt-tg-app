import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  List,
  ListItem,
  Paper,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import { 
  InsertDriveFile as FileIcon, 
  Image as ImageIcon, 
  VideoLibrary as VideoIcon,
  Download as DownloadIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/slices';
import { getMessages } from '@/services/getMessages';
import { addMessages, addMessage, removeAllMessages } from '@/slices/messagesSlice';
import { getLastMessage } from '@/services/getLastMessage';
import { setNotWaitingMsg, setCloseWaitingAnimation } from '@/slices/waitingMsgSlice';
import { putAwayActiveChat } from '@/slices/activeChatSlice';
import ReactMarkdown from 'react-markdown';
import formatTime from '@/utils/formatTime';

interface ChatWindowProps {
  onScrollDirectionChange?: (isScrollingDown: boolean) => void;
}

export function ChatWindow({ onScrollDirectionChange }: ChatWindowProps) {
  const dispatch = useDispatch();
  const messages = useSelector((state: RootState) => state.messages.messages);
  const { activeChatId, isNewChat } = useSelector((state: RootState) => state.activeChat);
  const token = useSelector((state: RootState) => state.auth.token);
  const isWaitingMsg = useSelector((state: RootState) => state.waitingMsg.isWaitingMsg);
  const openWaitingAnimation = useSelector((state: RootState) => state.waitingMsg.openWaitingAnimation);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon sx={{ fontSize: '1.2rem' }} />;
    } else if (type.startsWith('video/')) {
      return <VideoIcon sx={{ fontSize: '1.2rem' }} />;
    } else {
      return <FileIcon sx={{ fontSize: '1.2rem' }} />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileClick = (url: string) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  const handleFileDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewChat = () => {
    dispatch(putAwayActiveChat());
    dispatch(removeAllMessages());
  };

  const isChatFull = messages.length >= 50;

  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChatId || isNewChat) return;
      setIsLoading(true);
      try {
        const { items } = await getMessages(activeChatId);
        dispatch(addMessages(items));
      } catch (error) {
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
        const res = await getLastMessage(activeChatId);
        dispatch(addMessage(res));
      } catch (error) {
      } finally {
        dispatch(setNotWaitingMsg());
        dispatch(setCloseWaitingAnimation());
      }
    }
    fetchNewMessage();
  }, [isWaitingMsg, activeChatId, token, dispatch]);

  useEffect(() => {
    if (messages.length > 0 || openWaitingAnimation) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, openWaitingAnimation]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onScrollDirectionChange) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const isScrollingDown = scrollTop > lastScrollTop.current;
      
      if (Math.abs(scrollTop - lastScrollTop.current) > 5) {
        onScrollDirectionChange(isScrollingDown);
        lastScrollTop.current = scrollTop;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onScrollDirectionChange]);

  return (
    <>
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1,
          pt: '70px',
          pb: '140px',
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
                {messages.map((message) => {
                  const isUser = message.role === 'user' ? true : false;

                  const isEdited = message.updated_at && message.updated_at !== message.created_at;
                  const displayTime = isEdited 
                    ? `Изменено ${formatTime(message.updated_at)}` 
                    : formatTime(message.created_at);
                  
                  return (
                    <ListItem
                      key={message.id}
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
                          px: 1.5,
                          py: 0.5,
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
                        {/* Текст сообщения */}
                        {message.text && (
                          <Typography
                            variant="body1"
                            sx={{ 
                              lineHeight: 1.5,
                              fontSize: '0.95rem',
                              color: isUser ? '#ffffff' : 'text.primary',
                              position: 'relative',
                              zIndex: 1,
                              mb: message.has_file && message.attachments ? 1 : 0.3,
                            }}
                          >
                            <ReactMarkdown>{message.text}</ReactMarkdown>
                          </Typography>
                        )}

                        {/* Файлы */}
                        {message.has_file && message.attachments && message.attachments.length > 0 && (
                          <Box
                            sx={{
                              position: 'relative',
                              zIndex: 1,
                              mb: 0.3,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.5,
                            }}
                          >
                            {message.attachments.map((attachment, index) => (
                              <Paper
                                key={index}
                                elevation={0}
                                sx={{
                                  p: 1,
                                  borderRadius: '12px',
                                  background: isUser 
                                    ? 'rgba(255, 255, 255, 0.15)' 
                                    : 'rgba(66, 153, 225, 0.1)',
                                  border: `1px solid ${
                                    isUser 
                                      ? 'rgba(255, 255, 255, 0.2)' 
                                      : 'rgba(66, 153, 225, 0.2)'
                                  }`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease-in-out',
                                  '&:hover': {
                                    background: isUser 
                                      ? 'rgba(255, 255, 255, 0.2)' 
                                      : 'rgba(66, 153, 225, 0.15)',
                                    transform: 'translateY(-1px)',
                                  },
                                }}
                                onClick={() => handleFileClick(attachment.url)}
                              >
                                <Box sx={{ 
                                  color: isUser ? 'rgba(255, 255, 255, 0.9)' : 'rgba(66, 153, 225, 0.9)',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}>
                                  {getFileIcon(attachment.type)}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontSize: '0.85rem',
                                      color: isUser ? '#ffffff' : 'text.primary',
                                      fontWeight: 500,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {attachment.name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontSize: '0.7rem',
                                      color: isUser ? 'rgba(255, 255, 255, 0.7)' : 'rgba(66, 153, 225, 0.7)',
                                    }}
                                  >
                                    {formatFileSize(attachment.size)}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="Открыть">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleFileClick(attachment.url);
                                      }}
                                      sx={{
                                        width: 24,
                                        height: 24,
                                        color: isUser ? 'rgba(255, 255, 255, 0.8)' : 'rgba(66, 153, 225, 0.8)',
                                        '&:hover': {
                                          color: isUser ? '#ffffff' : 'rgba(66, 153, 225, 1)',
                                          backgroundColor: isUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(66, 153, 225, 0.1)',
                                        },
                                      }}
                                    >
                                      <OpenIcon sx={{ fontSize: '0.9rem' }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Скачать">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleFileDownload(attachment.url, attachment.name);
                                      }}
                                      sx={{
                                        width: 24,
                                        height: 24,
                                        color: isUser ? 'rgba(255, 255, 255, 0.8)' : 'rgba(66, 153, 225, 0.8)',
                                        '&:hover': {
                                          color: isUser ? '#ffffff' : 'rgba(66, 153, 225, 1)',
                                          backgroundColor: isUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(66, 153, 225, 0.1)',
                                        },
                                      }}
                                    >
                                      <DownloadIcon sx={{ fontSize: '0.9rem' }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Paper>
                            ))}
                          </Box>
                        )}

                        {/* Время сообщения */}
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.7rem',
                            color: isUser ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.5)',
                            display: 'block',
                            textAlign: isUser ? 'left' : 'right',
                            position: 'relative',
                            zIndex: 1,
                            mt: 0.2,
                            fontStyle: isEdited ? 'italic' : 'normal',
                          }}
                        >
                          {displayTime}
                        </Typography>
                      </Paper>
                    </ListItem>
                  );
                })}
                
                {/* Анимация ожидания ответа */}
                {openWaitingAnimation && (
                  <ListItem
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-start',
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
                        p: 1.5,
                        background: 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)',
                        borderRadius: '20px 20px 20px 6px',
                        maxWidth: '80%',
                        border: '1px solid rgba(45, 55, 72, 0.5)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        minWidth: '80px',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 0.8,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {[0, 1, 2].map((index) => (
                          <Box
                            key={index}
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'rgba(255, 255, 255, 0.7)',
                              animation: 'bounce 1.4s ease-in-out infinite',
                              animationDelay: `${index * 0.2}s`,
                              '@keyframes bounce': {
                                '0%, 60%, 100%': {
                                  transform: 'translateY(0)',
                                  opacity: 0.4,
                                },
                                '30%': {
                                  transform: 'translateY(-10px)',
                                  opacity: 1,
                                },
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </Paper>
                  </ListItem>
                )}
                
                {/* Невидимый элемент для автоскролла */}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <>
                {/* Если нет сообщений, но есть анимация ожидания */}
                {openWaitingAnimation ? (
                  <>
                    <ListItem
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-start',
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
                          p: 1.5,
                          background: 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)',
                          borderRadius: '20px 20px 20px 6px',
                          maxWidth: '80%',
                          border: '1px solid rgba(45, 55, 72, 0.5)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          minWidth: '80px',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 0.8,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {[0, 1, 2].map((index) => (
                            <Box
                              key={index}
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                animation: 'bounce 1.4s ease-in-out infinite',
                                animationDelay: `${index * 0.2}s`,
                                '@keyframes bounce': {
                                  '0%, 60%, 100%': {
                                    transform: 'translateY(0)',
                                    opacity: 0.4,
                                  },
                                  '30%': {
                                    transform: 'translateY(-10px)',
                                    opacity: 1,
                                  },
                                },
                              }}
                            />
                          ))}
                        </Box>
                      </Paper>
                    </ListItem>
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Чем могу помочь?
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </List>
        </Container>
      )}
      </Box>

      {/* Уведомление о переполненности чата */}
      {isChatFull && activeChatId !== null && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            backgroundColor: 'background.default',
            borderTop: '1px solid',
            borderTopColor: 'divider',
            backdropFilter: 'blur(10px)',
            background: 'linear-gradient(180deg, rgba(15, 20, 25, 0.95) 0%, rgba(15, 20, 25, 1) 100%)',
          }}
        >
          <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 }, py: 1.5 }}>
            <Paper
              elevation={3}
              sx={{
                px: 2.5,
                py: 1.5,
                borderRadius: '28px',
                background: 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E0 100%)',
                border: '1px solid rgba(203, 213, 224, 0.5)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#1A202C',
                  fontSize: '0.9rem',
                  lineHeight: 1.4,
                }}
              >
                Чат переполнен. Начните новый чат для продолжения
              </Typography>
              <Button
                onClick={handleNewChat}
                variant="contained"
                sx={{
                  borderRadius: '18px',
                  px: 2.5,
                  py: 1,
                  background: 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4A5568 0%, #2D3748 100%)',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                Новый чат
              </Button>
            </Paper>
          </Container>
        </Box>
      )}
    </>
  );
}