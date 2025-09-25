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
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

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

interface FormData {
  message: string;
}

const mockMessages: Message[] = [
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
];

export function ChatPage() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
  const [messages, setMessages] = React.useState<Message[]>(mockMessages);

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
          flexDirection: 'column',
          backgroundColor: 'background.default',
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
          }}
        >
          <Typography 
            variant="h5" 
            component="h1" 
            align="center" 
            color="text.primary"
            sx={{ 
              fontWeight: 600,
              letterSpacing: '-0.02em',
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
            p: 3,
            backgroundColor: 'primary.main',
            borderRadius: 0,
            borderTop: '1px solid',
            borderTopColor: 'divider',
          }}
        >
          <Container maxWidth="md">
            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'flex-end',
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.default',
                    borderRadius: '24px',
                    fontSize: '0.95rem',
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
                  borderRadius: '50%',
                  backgroundColor: 'secondary.main',
                  boxShadow: '0 4px 12px rgba(66, 153, 225, 0.3)',
                  '&:hover': {
                    backgroundColor: 'secondary.dark',
                    boxShadow: '0 6px 16px rgba(66, 153, 225, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <SendIcon sx={{ color: '#fff' }} />
              </Button>
            </Box>
          </Container>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
