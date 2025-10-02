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

export function ChatPage() {
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showChatTitle, setShowChatTitle] = useState(true);

  const handleMobileToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleScrollDirectionChange = (showTitle: boolean) => {
    setShowChatTitle(showTitle);
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
            minWidth: 0, // Важно для корректного overflow
            position: 'relative',
          }}
        >
          <ChatHeader onMobileToggle={handleMobileToggle} showTitle={showChatTitle} />
          {/* Окно чата теперь занимает всю оставшуюся область */}
          <ChatWindow onScrollDirectionChange={handleScrollDirectionChange} />
          {/* Форма ввода зафиксирована внизу поверх чата */}
          <MessageInput />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
