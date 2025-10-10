import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import { Close as CloseIcon, DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/slices';
import { setClose } from '@/slices/modalSlice';
import { useRemoveChat } from '@/hooks/useRemoveChat';
import { setActiveChat } from '@/slices/activeChatSlice';

export function ModalRemove() {
  const dispatch = useDispatch();
  const modalRemoveIsOpen = useSelector((state: RootState) => state.modals.removeModalIsOpen);
  const currentChat = useSelector((state: RootState) => state.modals.currentChat);
  const activeChatId = useSelector((state: RootState) => state.activeChat.activeChatId);
  const onCloseSidebar = useSelector((state: RootState) => state.modals.onCloseSidebar);

  const removeChatMutation = useRemoveChat();

  const handleClose = () => {
    dispatch(setClose('remove'));
  };

  const handleConfirm = async () => {
    if (!currentChat) return;

    try {
      await removeChatMutation.mutateAsync({ chatId: currentChat.id });
      
      if (activeChatId === currentChat.id) {
        dispatch(setActiveChat(null));
      }
      
      handleClose();
      
      // Закрываем сайдбар после удаления
      if (onCloseSidebar) {
        onCloseSidebar();
      }
    } catch (error) {
      // Ignore error
    }
  };
  
  return (
    <Dialog
      open={modalRemoveIsOpen}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1A202C',
          backgroundImage: 'none',
          borderRadius: 3,
          border: '1px solid',
          borderColor: '#2D3748',
          m: { xs: 2, sm: 3 },
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      {/* Заголовок */}
      <DialogTitle
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: 4,
          pb: 2,
          px: 3,
          position: 'relative',
        }}
      >
        {/* Кнопка закрытия */}
        <IconButton
          aria-label="закрыть"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 12,
            top: 12,
            color: '#A0AEC0',
            '&:hover': {
              backgroundColor: '#2D3748',
              color: '#F7FAFC',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {/* Иконка удаления */}
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'rgba(229, 62, 62, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <DeleteIcon sx={{ fontSize: 32, color: '#E53E3E' }} />
        </Box>

        {/* Заголовок */}
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontWeight: 600,
            color: '#F7FAFC',
            textAlign: 'center',
          }}
        >
          Удалить чат?
        </Typography>
      </DialogTitle>

      {/* Контент */}
      <DialogContent sx={{ px: 3, pb: 2, pt: 0 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            textAlign: 'center',
            lineHeight: 1.6,
            color: '#A0AEC0',
          }}
        >
         {currentChat ? `Это удалит "${currentChat?.chat_subject}"` : null}
        </Typography>
      </DialogContent>

      {/* Действия */}
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 2,
          gap: 1.5,
          flexDirection: { xs: 'column-reverse', sm: 'row' },
        }}
      >
        <Button
          onClick={handleClose}
          disabled={removeChatMutation.isPending}
          fullWidth
          sx={{
            color: '#F7FAFC',
            backgroundColor: 'transparent',
            border: '1px solid',
            borderColor: '#2D3748',
            textTransform: 'none',
            fontWeight: 500,
            py: 1.25,
            px: 3,
            fontSize: '0.9375rem',
            borderRadius: 2,
            '&:hover': {
              backgroundColor: '#2D3748',
              borderColor: '#4A5568',
            },
            '&:active': {
              backgroundColor: '#1A202C',
            },
          }}
        >
          Отмена
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={removeChatMutation.isPending}
          fullWidth
          sx={{
            backgroundColor: '#E53E3E',
            color: '#FFFFFF',
            textTransform: 'none',
            fontWeight: 600,
            py: 1.25,
            px: 3,
            fontSize: '0.9375rem',
            borderRadius: 2,
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: '#C53030',
              boxShadow: '0 4px 12px rgba(229, 62, 62, 0.3)',
            },
            '&:active': {
              backgroundColor: '#9B2C2C',
            },
            '&:disabled': {
              backgroundColor: 'rgba(229, 62, 62, 0.4)',
              color: '#A0AEC0',
            },
          }}
        >
          {removeChatMutation.isPending ? 'Удаление...' : 'Удалить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

