import { useState } from 'react';
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
import { useEffect } from 'react';

export function ChatPage() {
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showChatTitle, setShowChatTitle] = useState(true);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) {
      // Fallback для разработки вне Telegram
      setViewportHeight(window.innerHeight);
      return;
    }

    // Инициализация Telegram WebApp
    tg.ready();
    tg.expand();

    let rafId: number | null = null;

    // Плавное обновление высоты viewport
    const updateHeight = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        const newHeight = tg.viewportHeight || window.innerHeight;
        setViewportHeight(newHeight);
      });
    };

    // Слушаем изменения viewport
    tg.onEvent('viewportChanged', updateHeight);

    // Устанавливаем начальную высоту
    updateHeight();

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      tg.offEvent('viewportChanged', updateHeight);
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
          height: viewportHeight + 'px',
          display: 'flex',
          backgroundColor: 'background.default',
          transition: 'height 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          willChange: 'height',
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
          
          {/* Окно чата занимает всю область */}
          <ChatWindow onScrollDirectionChange={handleScrollDirectionChange} />
          
          {/* Форма ввода зафиксирована внизу поверх чата */}
          <MessageInput />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
