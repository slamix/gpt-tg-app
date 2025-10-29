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
    const isAndroid = /Android/i.test(navigator.userAgent);
    
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

    // Для Android добавляем обработку visualViewport
    const handleVisualViewportResize = () => {
      if (window.visualViewport) {
        const height = window.visualViewport.height;
        document.documentElement.style.setProperty('--tg-viewport-height', `${height}px`);
      } else {
        updateViewportHeight();
      }
    };

    // Основной обработчик от Telegram
    tg.onEvent('viewportChanged', updateViewportHeight);
    
    // Дополнительные обработчики для Android
    if (isAndroid) {
      window.addEventListener('resize', updateViewportHeight);
      
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleVisualViewportResize);
      }
    }

    // Начальная установка
    updateViewportHeight();

    return () => {
      tg.offEvent('viewportChanged', updateViewportHeight);
      
      if (isAndroid) {
        window.removeEventListener('resize', updateViewportHeight);
        
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
        }
      }
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
