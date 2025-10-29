import { useState, useEffect } from 'react';
import {
  Box,
  ThemeProvider,
  CssBaseline,
} from '@mui/material';
import { Sidebar } from '@/components/chat-page/Sidebar';
import { ChatHeader } from '@/components/chat-page/ChatHeader';
import { ChatWindow } from '@/components/chat-page/ChatWindow';
import { MessageInput } from '@/components/chat-page/MessageInput';
import theme from '@/theme';

export function ChatPage() {
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showChatTitle, setShowChatTitle] = useState(true);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) {
      // Fallback для разработки вне Telegram
      document.documentElement.style.setProperty('--tg-viewport-height', `${window.innerHeight}px`);
      return;
    }

    tg.ready();
    tg.expand();

    // Устанавливаем CSS переменную --tg-viewport-height
    const updateViewportHeight = () => {
      const height = tg.viewportHeight || window.innerHeight;
      document.documentElement.style.setProperty('--tg-viewport-height', `${height}px`);
    };

    tg.onEvent('viewportChanged', updateViewportHeight);
    updateViewportHeight();

    return () => {
      tg.offEvent('viewportChanged', updateViewportHeight);
    };
  }, []);

  const handleMobileToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleScrollDirectionChange = (isScrollingDown: boolean) => {
    setShowChatTitle(!isScrollingDown);
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
          mobileOpen={mobileOpen}
          onMobileToggle={handleMobileToggle}
        />

        {/* Основная область чата */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            position: 'relative',
          }}
        >
          {/* Плавающий хедер поверх контента */}
          <ChatHeader 
            onMobileToggle={handleMobileToggle} 
            showChatTitle={showChatTitle}
          />
          
          {/* Контейнер для чата (ChatWindow + MessageInput) */}
          <Box
            className="chat"
            sx={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              left: { xs: 0, md: '280px' },
              height: 'var(--tg-viewport-height, 100dvh)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Окно чата */}
            <ChatWindow onScrollDirectionChange={handleScrollDirectionChange} />
            
            {/* Форма ввода - position: absolute внутри .chat */}
            <MessageInput />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
