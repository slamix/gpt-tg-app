import {
  Box,
  Typography,
  IconButton,
  Fade,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/slices';
import useGetChats from '@/hooks/useGetChats';
import { getAllChatsFromPages } from '@/services/getChats';

interface ChatHeaderProps {
  onMobileToggle: () => void;
  showChatTitle: boolean;
}

export function ChatHeader({ onMobileToggle, showChatTitle }: ChatHeaderProps) {
  const activeChatId = useSelector((state: RootState) => state.activeChat.activeChatId);
  
  const { data } = useGetChats(50);
  const allChats = getAllChatsFromPages(data?.pages);
  
  const activeChat = allChats.find(chat => chat.id === activeChatId);
  const chatTitle = activeChatId === null ? 'CFT Assistant' : activeChat?.chat_subject || 'CFT Assistant';

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        gap: 2,
        pointerEvents: 'none',
      }}
    >
      {/* Круглая кнопка меню - всегда видна */}
      <IconButton 
        onClick={onMobileToggle}
        sx={{
          backgroundColor: 'rgba(45, 55, 72, 0.95)',
          backdropFilter: 'blur(10px)',
          color: '#fff',
          width: 44,
          height: 44,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          pointerEvents: 'auto',
          '&:hover': {
            backgroundColor: 'rgba(45, 55, 72, 1)',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Плавающее название чата - скрывается при скролле вниз */}
      <Fade in={showChatTitle} timeout={300}>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            backgroundColor: 'rgba(45, 55, 72, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '22px',
            padding: '12px 20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            pointerEvents: 'auto',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Typography 
            variant="body1" 
            sx={{ 
              fontWeight: 600,
              color: '#fff',
              textAlign: 'center',
              fontSize: '0.95rem',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {chatTitle}
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
}