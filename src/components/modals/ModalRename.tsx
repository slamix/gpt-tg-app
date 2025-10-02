import { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import { Close as CloseIcon, EditOutlined as EditIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/slices';
import { setClose } from '@/slices/modalSlice';
import { useRenameChat } from '@/hooks/useRenameChat';

interface RenameFormData {
  title: string;
}

export function ModalRename() {
  const dispatch = useDispatch();
  const modalRenameIsOpen = useSelector((state: RootState) => state.modals.renameModalIsOpen);
  const currentChat = useSelector((state: RootState) => state.modals.currentChat);
  const token = useSelector((state: RootState) => state.auth.token);

  const renameChatMutation = useRenameChat({ token: token as string });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<RenameFormData>({
    defaultValues: {
      title: '',
    },
  });

  // Обновляем значение формы при изменении currentChat
  useEffect(() => {
    if (modalRenameIsOpen && currentChat?.chat_subject) {
      setValue('title', currentChat.chat_subject);
    }
  }, [modalRenameIsOpen, currentChat, setValue]);

  useEffect(() => {
    if (!modalRenameIsOpen) {
      reset();
    }
  }, [modalRenameIsOpen, reset]);

  const handleClose = () => {
    reset();
    dispatch(setClose('rename'));
  };

  const onSubmit = async (data: RenameFormData) => {
    if (!currentChat || !data.title.trim()) return;

    try {
      await renameChatMutation.mutateAsync({
        chatId: currentChat.id,
        newSubject: data.title.trim(),
      });
      handleClose();
    } catch (error) {
      console.error('Ошибка при переименовании чата:', error);
    }
  };

  return (
    <Dialog
      open={modalRenameIsOpen}
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
      <form onSubmit={handleSubmit(onSubmit)}>
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
            disabled={renameChatMutation.isPending}
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

          {/* Иконка редактирования */}
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(66, 153, 225, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <EditIcon sx={{ fontSize: 32, color: '#4299E1' }} />
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
            Переименовать чат
          </Typography>
        </DialogTitle>

        {/* Контент */}
        <DialogContent sx={{ px: 3, pb: 2, pt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            placeholder="Новое название чата"
            variant="outlined"
            disabled={renameChatMutation.isPending}
            error={!!errors.title}
            helperText={errors.title?.message}
            {...register('title', {
              required: 'Название чата обязательно',
              minLength: {
                value: 1,
                message: 'Название должно содержать хотя бы 1 символ',
              },
              maxLength: {
                value: 100,
                message: 'Название не должно превышать 100 символов',
              },
              validate: {
                notEmpty: (value) =>
                  value.trim().length > 0 || 'Название не может быть пустым',
              },
            })}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#0F1419',
                borderRadius: 2,
                '& fieldset': {
                  borderColor: '#2D3748',
                },
                '&:hover fieldset': {
                  borderColor: '#4A5568',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4299E1',
                  borderWidth: '2px',
                },
              },
              '& .MuiOutlinedInput-input': {
                color: '#F7FAFC',
                py: 1.5,
                '&::placeholder': {
                  color: '#718096',
                  opacity: 1,
                },
              },
              '& .MuiFormHelperText-root': {
                mx: 0.5,
                mt: 0.75,
                color: '#FC8181',
              },
            }}
          />
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
            disabled={renameChatMutation.isPending}
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
            Отменить
          </Button>
          <Button
            type="submit"
            disabled={renameChatMutation.isPending}
            fullWidth
            sx={{
              backgroundColor: '#4299E1',
              color: '#FFFFFF',
              textTransform: 'none',
              fontWeight: 600,
              py: 1.25,
              px: 3,
              fontSize: '0.9375rem',
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#3182CE',
                boxShadow: '0 4px 12px rgba(66, 153, 225, 0.3)',
              },
              '&:active': {
                backgroundColor: '#2C5282',
              },
              '&:disabled': {
                backgroundColor: 'rgba(66, 153, 225, 0.4)',
                color: '#A0AEC0',
              },
            }}
          >
            {renameChatMutation.isPending ? 'Переименование...' : 'Переименовать'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

