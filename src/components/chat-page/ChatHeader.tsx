import {
  Box,
  Paper,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/slices';

interface ChatHeaderProps {
  onMobileToggle: () => void;
  showTitle: boolean;
}

export function ChatHeader({ onMobileToggle, showTitle }: ChatHeaderProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const activeChat = useSelector((state: RootState) => state.activeChat.activeChat);

  return (
    <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
      {/* Кнопка меню - всегда видна, фиксированная ширина */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          backgroundColor: 'primary.main',
          borderRadius: 0,
          borderBottom: '1px solid',
          borderBottomColor: 'divider',
          borderRight: '1px solid',
          borderRightColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '60px',
          width: '60px',
        }}
      >
        {isMobile && (
          <IconButton 
            onClick={onMobileToggle}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
        )}
      </Paper>

      {/* Заголовок - исчезает при скролле вверх */}
      <Box
        sx={{
          flex: 1,
          maxHeight: showTitle ? '60px' : '0px',
          opacity: showTitle ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, opacity 0.3s ease',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            backgroundColor: 'primary.main',
            borderRadius: 0,
            borderBottom: '1px solid',
            borderBottomColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <Typography 
            variant="h6" 
            component="h6" 
            color="text.primary"
            sx={{ 
              fontWeight: 500,
              letterSpacing: '-0.01em',
              textAlign: 'center',
            }}
          >
            {activeChat === null ? 'CFT Assistant' : activeChat.chat_subject}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
