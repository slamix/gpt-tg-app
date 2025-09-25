import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Typography,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Chat as ChatIcon,
  MoreVert as MoreVertIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface Chat {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp?: Date;
}

interface SidebarProps {
  chats: Chat[];
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onChatRename: (chatId: string, newTitle: string) => void;
  onChatDelete: (chatId: string) => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

export function Sidebar({ 
  chats, 
  currentChatId, 
  onChatSelect, 
  onNewChat,
  onChatRename,
  onChatDelete,
  mobileOpen,
  onMobileToggle 
}: SidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Состояние для меню действий
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedChatId, setSelectedChatId] = React.useState<string | null>(null);
  
  // Состояние для диалога переименования
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [newChatTitle, setNewChatTitle] = React.useState('');

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, chatId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedChatId(chatId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedChatId(null);
  };

  const handleRename = () => {
    const chat = chats.find(c => c.id === selectedChatId);
    if (chat) {
      setNewChatTitle(chat.title);
      setRenameDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedChatId) {
      onChatDelete(selectedChatId);
    }
    handleMenuClose();
  };

  const handleRenameConfirm = () => {
    if (selectedChatId && newChatTitle.trim()) {
      onChatRename(selectedChatId, newChatTitle.trim());
    }
    setRenameDialogOpen(false);
    setNewChatTitle('');
    setSelectedChatId(null);
  };

  const handleRenameCancel = () => {
    setRenameDialogOpen(false);
    setNewChatTitle('');
    setSelectedChatId(null);
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
          ChatGPT
        </Typography>
        {isMobile && (
          <IconButton onClick={onMobileToggle} color="inherit">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Кнопка нового чата */}
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onNewChat}
          sx={{
            justifyContent: 'flex-start',
            py: 1.5,
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': {
              borderColor: 'secondary.main',
              backgroundColor: 'rgba(66, 153, 225, 0.04)',
            },
          }}
        >
          Новый чат
        </Button>
      </Box>

      {/* Заголовок списка чатов */}
      <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderBottomColor: 'divider' }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
          Чаты
        </Typography>
      </Box>

      {/* Список чатов */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ px: 1 }}>
          {chats.map((chat) => (
            <ListItem key={chat.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={currentChatId === chat.id}
                onClick={() => onChatSelect(chat.id)}
                sx={{
                  borderRadius: 2,
                  minHeight: 48,
                  pr: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'secondary.main',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: 'secondary.dark',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(66, 153, 225, 0.04)',
                  },
                }}
              >
                <ChatIcon sx={{ mr: 2, fontSize: 20, opacity: 0.7 }} />
                <ListItemText
                  primary={chat.title}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: currentChatId === chat.id ? 600 : 400,
                    noWrap: true,
                  }}
                />
                <IconButton
                  className="chat-menu-button"
                  size="small"
                  onClick={(e) => handleMenuClick(e, chat.id)}
                  sx={{
                    opacity: 0.7,
                    transition: 'opacity 0.2s',
                    color: 'inherit',
                    ml: 1,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
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
            keepMounted: true, // Лучшая производительность на мобильных
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

      {/* Выпадающее меню действий - всегда рендерится в корне */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        sx={{
          zIndex: 9999,
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            backgroundColor: 'primary.main',
            border: '1px solid',
            borderColor: 'divider',
            minWidth: 180,
          },
        }}
      >
        <MenuItem 
          onClick={handleRename}
          sx={{
            color: 'text.primary',
            '&:hover': {
              backgroundColor: 'rgba(66, 153, 225, 0.08)',
            },
          }}
        >
          <ArchiveIcon sx={{ mr: 2, fontSize: 18 }} />
          Переименовать
        </MenuItem>
        <MenuItem 
          onClick={handleDelete}
          sx={{
            color: '#ff6b6b',
            '&:hover': {
              backgroundColor: 'rgba(255, 107, 107, 0.08)',
            },
          }}
        >
          <DeleteIcon sx={{ mr: 2, fontSize: 18 }} />
          Удалить
        </MenuItem>
      </Menu>

      {/* Диалог переименования - всегда рендерится в корне */}
      <Dialog 
        open={renameDialogOpen} 
        onClose={handleRenameCancel}
        sx={{
          zIndex: 10000,
        }}
        PaperProps={{
          sx: {
            backgroundColor: 'primary.main',
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <DialogTitle sx={{ color: 'text.primary' }}>
          Переименовать чат
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="Введите новое название"
            variant="outlined"
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.default',
                '& fieldset': {
                  borderColor: 'divider',
                },
                '&:hover fieldset': {
                  borderColor: 'secondary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'secondary.main',
                },
              },
              '& .MuiInputBase-input': {
                color: 'text.primary',
              },
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleRenameConfirm();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleRenameCancel}
            sx={{ color: 'text.secondary' }}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleRenameConfirm}
            variant="contained"
            sx={{
              backgroundColor: 'secondary.main',
              '&:hover': {
                backgroundColor: 'secondary.dark',
              },
            }}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
