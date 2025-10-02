import { createTheme } from '@mui/material';

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

export default theme;
