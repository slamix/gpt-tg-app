import {
  Box,
  Typography,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
} from '@mui/icons-material';
import { NewChatButton } from './NewChatButton';
import { ChatsList } from './ChatsList';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

export function Sidebar( { mobileOpen, onMobileToggle }: SidebarProps ) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMobileToggle = () => {
    if (onMobileToggle) {
      onMobileToggle();
    }
  };

  const sidebarContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'primary.main',
        borderRight: isMobile ? 'none' : '1px solid',
        borderRightColor: 'divider',
      }}
    >
      {/* Заголовок с кнопкой закрытия на мобильных */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderBottomColor: 'divider',
        }}
      >
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
          CFT AI
        </Typography>
        {isMobile && (
          <IconButton onClick={handleMobileToggle} color="inherit">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Кнопка нового чата */}
      <NewChatButton onMobileClose={isMobile ? handleMobileToggle : undefined}/>

      {/* Список чатов */}
      <ChatsList
        onMobileClose={isMobile ? handleMobileToggle : undefined}
      />
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onMobileToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
              backgroundColor: 'primary.main',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
        <Box
          sx={{
            width: 280,
            flexShrink: 0,
          }}
        >
          {sidebarContent}
        </Box>
      )}
    </>
  );
}
