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
import { postEvent } from '@telegram-apps/sdk-react';

export function ChatPage() {
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showChatTitle, setShowChatTitle] = useState(true);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    // Сообщаем Telegram, что WebApp готов и должен быть развёрнут
    postEvent('web_app_ready');
    postEvent('web_app_expand');

    // Подписка на изменение viewport
    const updateHeight = (data?: any) => {
      const newHeight =
        data?.viewportHeight ??
        tg.viewportHeight ??
        window.innerHeight;

      setViewportHeight(newHeight);
    };

    tg.onEvent('viewportChanged', updateHeight);

    // ⚡ Запрашиваем у Telegram актуальные данные сразу
    tg.postEvent('web_app_request_viewport');

    // На всякий случай делаем первый апдейт из текущего состояния
    updateHeight();

    return () => {
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
