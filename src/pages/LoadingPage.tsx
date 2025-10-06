import { Box, CircularProgress, Typography } from '@mui/material';

export default function LoadingPage() {
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
      {/* Анимированное кольцо */}
      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
          mb: 3,
        }}
      >
        {/* Внешнее статичное кольцо (фон) */}
        <CircularProgress
          size={80}
          thickness={3}
          sx={{
            color: 'rgba(66, 153, 225, 0.15)',
            position: 'absolute',
          }}
          variant="determinate"
          value={100}
        />
        
        {/* Вращающееся кольцо */}
        <CircularProgress
          size={80}
          thickness={3}
          sx={{
            color: '#4299E1',
            animationDuration: '1s',
            filter: 'drop-shadow(0 0 8px rgba(66, 153, 225, 0.4))',
          }}
        />
      </Box>

      {/* Текст загрузки */}
      <Typography
        variant="h6"
        sx={{
          color: '#F7FAFC',
          fontWeight: 500,
          letterSpacing: '0.5px',
          mb: 1,
        }}
      >
        Загрузка...
      </Typography>
      
      {/* Дополнительный текст */}
      <Typography
        variant="body2"
        sx={{
          color: '#A0AEC0',
          fontSize: '0.875rem',
        }}
      >
        Пожалуйста, подождите
      </Typography>

      {/* Пульсирующие точки для дополнительной анимации */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mt: 3,
        }}
      >
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#4299E1',
              opacity: 0.6,
              animation: 'pulse 1.4s ease-in-out infinite',
              animationDelay: `${index * 0.2}s`,
              '@keyframes pulse': {
                '0%, 100%': {
                  opacity: 0.3,
                  transform: 'scale(0.8)',
                },
                '50%': {
                  opacity: 1,
                  transform: 'scale(1.2)',
                },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

