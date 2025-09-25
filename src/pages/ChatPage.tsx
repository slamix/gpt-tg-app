import React from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Container,
  TextField,
  Button,
  Paper,
  Typography,
  Avatar,
  List,
  ListItem,
  ThemeProvider,
  createTheme,
  CssBaseline,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Send as SendIcon, Menu as MenuIcon } from '@mui/icons-material';
import { Sidebar } from '@/components/Sidebar';

// Создаём элегантную тёмную тему для чат-бота
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2D3748', // тёмно-серый с лёгким голубоватым оттенком
      light: '#4A5568',
      dark: '#1A202C',
    },
    secondary: {
      main: '#4299E1', // мягкий голубой для акцентов
      light: '#63B3ED',
      dark: '#3182CE',
    },
    background: {
      default: '#0F1419', // очень тёмный фон для глаз
      paper: '#1A202C', // тёмно-серый для карточек сообщений
    },
    text: {
      primary: '#F7FAFC', // мягкий белый
      secondary: '#A0AEC0', // приглушённый серый для вторичного текста
    },
    divider: '#2D3748',
    // Кастомные цвета для сообщений
    info: {
      main: '#1A202C', // фон сообщений GPT
      dark: '#2D3748', // фон сообщений пользователя  
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

interface Chat {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp?: Date;
}

interface FormData {
  message: string;
}

const mockChats: Chat[] = [
  {
    id: '1',
    title: 'Квантовые компьютеры',
    lastMessage: 'Расскажи мне о квантовых компьютерах',
    timestamp: new Date('2024-01-01T10:00:00'),
  },
  {
    id: '2',
    title: 'Изучение React',
    lastMessage: 'Как создать компонент в React?',
    timestamp: new Date('2024-01-01T09:30:00'),
  },
  {
    id: '3',
    title: 'Рецепт борща',
    lastMessage: 'Напиши рецепт украинского борща',
    timestamp: new Date('2024-01-01T09:00:00'),
  },
  {
    id: '4',
    title: 'Планирование поездки',
    lastMessage: 'Помоги спланировать поездку в Европу',
    timestamp: new Date('2024-01-01T08:30:00'),
  },
  {
    id: '5',
    title: 'Изучение TypeScript',
    lastMessage: 'В чём разница между interface и type?',
    timestamp: new Date('2024-01-01T08:00:00'),
  },
];

const mockMessages: { [chatId: string]: Message[] } = {
  '1': [
    {
      id: 1,
      text: 'Привет! Я ChatGPT, готов помочь вам с любыми вопросами.',
      isUser: false,
    },
    {
      id: 2,
      text: 'Расскажи мне о квантовых компьютерах',
      isUser: true,
    },
    {
      id: 3,
      text: 'Квантовые компьютеры — это вычислительные устройства, которые используют принципы квантовой механики для обработки информации. В отличие от классических компьютеров, которые используют биты (0 или 1), квантовые компьютеры используют квантовые биты или кубиты, которые могут находиться в суперпозиции состояний.',
      isUser: false,
    },
    {
      id: 4,
      text: 'А как они работают?',
      isUser: true,
    },
    {
      id: 5,
      text: 'Квантовые компьютеры работают благодаря квантовым явлениям: суперпозиции (кубит может быть одновременно в состоянии 0 и 1), запутанности (связь между кубитами) и интерференции. Эти свойства позволяют квантовым компьютерам решать определённые задачи экспоненциально быстрее классических компьютеров.',
      isUser: false,
    },
  ],
  '2': [
    {
      id: 1,
      text: 'Как создать компонент в React?',
      isUser: true,
    },
    {
      id: 2,
      text: 'В React компонент можно создать как функцию или класс. Рекомендуется использовать функциональные компоненты с хуками.',
      isUser: false,
    },
  ],
};

export function ChatPage() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
  const [chats, setChats] = React.useState<Chat[]>(mockChats);
  const [currentChatId, setCurrentChatId] = React.useState<string>('1');
  const [messages, setMessages] = React.useState<Message[]>(mockMessages[currentChatId] || []);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Обновляем сообщения при смене чата
  React.useEffect(() => {
    setMessages(mockMessages[currentChatId] || []);
  }, [currentChatId]);

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleNewChat = () => {
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    setMessages([]);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleMobileToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleChatRename = (chatId: string, newTitle: string) => {
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      )
    );
  };

  const handleChatDelete = (chatId: string) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    
    // Если удаляем активный чат, переключаемся на первый доступный
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        // Если чатов не осталось, создаём новый
        handleNewChat();
      }
    }
  };

  const onSubmit = (data: FormData) => {
    if (!data.message.trim()) return;

    const newUserMessage: Message = {
      id: Date.now(),
      text: data.message,
      isUser: true,
    };

    setMessages(prev => [...prev, newUserMessage]);
    reset();

    // Имитируем ответ GPT через 1 секунду
    setTimeout(() => {
      const gptResponse: Message = {
        id: Date.now() + 1,
        text: 'Это заглушка ответа GPT. В реальном приложении здесь будет API-запрос к ChatGPT.',
        isUser: false,
      };
      setMessages(prev => [...prev, gptResponse]);
    }, 1000);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          backgroundColor: 'background.default',
        }}
      >
        {/* Боковая панель */}
        <Sidebar
          chats={chats}
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          onChatRename={handleChatRename}
          onChatDelete={handleChatDelete}
          mobileOpen={mobileOpen}
          onMobileToggle={handleMobileToggle}
        />

        {/* Основная область чата */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0, // Важно для корректного overflow
          }}
        >
          {/* Заголовок чата */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              backgroundColor: 'primary.main',
              borderRadius: 0,
              borderBottom: '1px solid',
              borderBottomColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {isMobile && (
              <IconButton 
                onClick={handleMobileToggle}
                color="inherit"
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography 
              variant="h5" 
              component="h1" 
              color="text.primary"
              sx={{ 
                fontWeight: 600,
                letterSpacing: '-0.02em',
                flex: 1,
                textAlign: isMobile ? 'left' : 'center',
              }}
            >
              ChatGPT Assistant
            </Typography>
          </Paper>

        {/* Область сообщений */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 1,
            backgroundColor: 'background.default',
          }}
        >
          <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2 } }}>
            <List sx={{ py: 1 }}>
              {messages.map((message) => (
                <ListItem
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                    mb: 1,
                    px: 0,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: message.isUser ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      maxWidth: '80%',
                      gap: 1,
                    }}
                  >
                    {!message.isUser && (
                      <Avatar
                        sx={{
                          bgcolor: 'secondary.main',
                          width: 36,
                          height: 36,
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }}
                      >
                        AI
                      </Avatar>
                    )}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        backgroundColor: message.isUser ? 'info.dark' : 'info.main',
                        borderRadius: message.isUser ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                        maxWidth: '100%',
                        wordBreak: 'break-word',
                        border: '1px solid',
                        borderColor: message.isUser ? 'primary.light' : 'divider',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                      }}
                    >
                      <Typography
                        variant="body1"
                        color="text.primary"
                        sx={{ 
                          lineHeight: 1.5,
                          fontSize: '0.95rem',
                        }}
                      >
                        {message.text}
                      </Typography>
                    </Paper>
                    {message.isUser && (
                      <Avatar
                        sx={{
                          bgcolor: 'secondary.dark',
                          width: 36,
                          height: 36,
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }}
                      >
                        Я
                      </Avatar>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          </Container>
        </Box>

        {/* Форма ввода */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            backgroundColor: 'primary.main',
            borderRadius: 0,
            borderTop: '1px solid',
            borderTopColor: 'divider',
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{
              display: 'flex',
              gap: 1.5,
              alignItems: 'flex-end',
              width: '100%',
            }}
          >
            <TextField
              {...register('message', { 
                required: 'Введите сообщение',
                minLength: { value: 1, message: 'Сообщение не может быть пустым' }
              })}
              fullWidth
              multiline
              maxRows={4}
              placeholder="Введите ваше сообщение..."
              variant="outlined"
              error={!!errors.message}
              helperText={errors.message?.message}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(onSubmit)();
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.default',
                  borderRadius: '24px',
                  fontSize: '0.95rem',
                  minHeight: '56px',
                  '& fieldset': {
                    borderColor: 'divider',
                    borderWidth: '1px',
                  },
                  '&:hover fieldset': {
                    borderColor: 'secondary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'secondary.main',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputBase-input': {
                  color: 'text.primary',
                  padding: '16px 20px',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'text.secondary',
                  opacity: 0.8,
                },
                '& .MuiFormHelperText-root': {
                  marginLeft: '20px',
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              sx={{
                minWidth: 56,
                height: 56,
                borderRadius: '28px',
                backgroundColor: 'secondary.main',
                boxShadow: '0 2px 8px rgba(66, 153, 225, 0.3)',
                '&:hover': {
                  backgroundColor: 'secondary.dark',
                  boxShadow: '0 4px 12px rgba(66, 153, 225, 0.4)',
                },
                transition: 'all 0.2s ease-in-out',
                flexShrink: 0,
              }}
            >
              <SendIcon sx={{ color: '#fff' }} />
            </Button>
          </Box>
        </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
