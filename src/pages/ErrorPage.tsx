import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { retrieveRawInitData } from '@telegram-apps/sdk';
import { dispatch } from '@/slices';
import { initAuth } from '@/slices/thunks/authThunks';

interface ErrorPageProps {
  error: string;
}

export default function ErrorPage({ error }: ErrorPageProps) {
  const handleReload = () => {
    const initData = retrieveRawInitData();
    if (initData) {
      dispatch(initAuth(initData) as any);
    } else {
      window.location.reload();
    }
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F1419',
        background: 'linear-gradient(135deg, #0F1419 0%, #1A202C 100%)',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
      }}
    >
      {/* Иконка ошибки */}
      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
          mb: 3,
        }}
      >
        {/* Внешнее кольцо */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: '3px solid rgba(239, 68, 68, 0.15)',
            position: 'absolute',
          }}
        />
        
        {/* Иконка ошибки */}
        <ErrorOutlineIcon
          sx={{
            fontSize: 80,
            color: '#EF4444',
            filter: 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.4))',
          }}
        />
      </Box>

      {/* Заголовок ошибки */}
      <Typography
        variant="h6"
        sx={{
          color: '#F7FAFC',
          fontWeight: 500,
          letterSpacing: '0.5px',
          mb: 1,
        }}
      >
        Ошибка авторизации
      </Typography>
      
      {/* Текст ошибки */}
      <Typography
        variant="body2"
        sx={{
          color: '#A0AEC0',
          fontSize: '0.875rem',
          mb: 3,
          textAlign: 'center',
          maxWidth: '400px',
          px: 2,
        }}
      >
        {error}
      </Typography>

      {/* Кнопка перезагрузки */}
      <Button
        variant="contained"
        onClick={handleReload}
        sx={{
          backgroundColor: '#4299E1',
          color: '#F7FAFC',
          textTransform: 'none',
          px: 4,
          py: 1.5,
          borderRadius: 2,
          fontWeight: 500,
          '&:hover': {
            backgroundColor: '#3182CE',
          },
          boxShadow: '0 4px 14px 0 rgba(66, 153, 225, 0.39)',
        }}
      >
        Перезагрузить
      </Button>

      {/* Декоративные элементы */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mt: 4,
        }}
      >
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#EF4444',
              opacity: 0.4,
              animation: 'pulse 2s ease-in-out infinite',
              animationDelay: `${index * 0.3}s`,
              '@keyframes pulse': {
                '0%, 100%': {
                  opacity: 0.2,
                  transform: 'scale(0.8)',
                },
                '50%': {
                  opacity: 0.6,
                  transform: 'scale(1)',
                },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

