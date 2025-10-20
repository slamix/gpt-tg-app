import { useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { editMessage } from '@/services/editMessage';
import { redactMessage } from '@/slices/messagesSlice';
import { setIsSending, setOpenWaitingAnimation, setWaitingMsg } from '@/slices/waitingMsgSlice';

interface EditWindowProps {
  messageId: number;
  onCancel: () => void;
  onSave: () => void;
  editedText: string;
  setEditedText: (text: string) => void;
}

export function EditWindow({ messageId, onCancel, onSave, editedText, setEditedText, }: EditWindowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSave = async () => {
    if (editedText.trim() === '') {
      return;
    }
    try {
      const now = new Date();
      onSave();
      dispatch(redactMessage({ messageId, newText: editedText, updatedAt: now.toISOString()}));
      dispatch(setIsSending(true));
      dispatch(setOpenWaitingAnimation());
      await editMessage({ messageId, newText: editedText});
      dispatch(setWaitingMsg());
    } catch (err) {
      console.log('Ошибка при редактировании сообщения');
    } finally {
      dispatch(setIsSending(false));
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        animation: 'fadeInUp 0.3s ease-out',
        '@keyframes fadeInUp': {
          '0%': {
            opacity: 0,
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 2.5,
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #3A4557 0%, #2A3441 100%)',
          border: '1px solid rgba(66, 153, 225, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Текстовое поле с ограничением высоты и скроллом */}
        <Box
          sx={{
            mb: 2,
            maxHeight: '200px',
            overflowY: 'auto',
            borderRadius: '16px',
            backgroundColor: 'rgba(66, 153, 225, 0.08)',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(66, 153, 225, 0.4)',
              borderRadius: '10px',
              '&:hover': {
                background: 'rgba(66, 153, 225, 0.6)',
              },
            },
          }}
        >
          <TextField
            inputRef={inputRef}
            multiline
            fullWidth
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            variant="standard"
            placeholder="Введите текст сообщения"
            sx={{
              '& .MuiInputBase-root': {
                color: '#ffffff',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                padding: '14px 16px',
              },
              '& .MuiInput-underline:before': {
                borderBottom: 'none',
              },
              '& .MuiInput-underline:after': {
                borderBottom: 'none',
              },
              '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                borderBottom: 'none',
              },
            }}
          />
        </Box>

        {/* Кнопки */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            justifyContent: 'flex-end',
          }}
        >
          <Button
            onClick={onCancel}
            variant="text"
            sx={{
              borderRadius: '12px',
              px: 2,
              py: 0.75,
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.9rem',
              fontWeight: 500,
              textTransform: 'none',
              minHeight: 'auto',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
              },
            }}
          >
            Отменить
          </Button>
          <Button
            onClick={handleSave}
            disabled={editedText.trim() === ''}
            variant="contained"
            sx={{
              borderRadius: '12px',
              px: 2.5,
              py: 0.75,
              background: 'linear-gradient(135deg, #5B9FD8 0%, #4A8BC2 100%)',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 600,
              textTransform: 'none',
              minHeight: 'auto',
              boxShadow: '0 4px 12px rgba(66, 153, 225, 0.25)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4A8BC2 0%, #3A7AAF 100%)',
                boxShadow: '0 6px 16px rgba(66, 153, 225, 0.35)',
              },
              '&:disabled': {
                background: 'rgba(66, 153, 225, 0.3)',
                color: 'rgba(255, 255, 255, 0.5)',
                boxShadow: 'none',
              },
            }}
          >
            Отправить
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
