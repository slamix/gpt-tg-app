import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Container,
  TextField,
  Button,
  Paper,
  // TODO: Раскомментировать когда API для файлов будет готово
  // IconButton,
  // Chip,
  // Typography,
  // LinearProgress,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
// TODO: Раскомментировать когда API для файлов будет готово
// import { AttachFile as AttachFileIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/slices';
import { askChat } from '@/services/askChat';
import { addMessage } from '@/slices/messagesSlice';
import { useCreateChat } from '@/hooks/useCreateChat';
import { setActiveChat } from '@/slices/activeChatSlice';

interface FormData {
  message: string;
}

export function MessageInput() {
  const { register, handleSubmit, reset, watch } = useForm<FormData>();
  const [isSending, setIsSending] = useState(false);
  
  // TODO: Раскомментировать когда API для файлов будет готово
  // const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  // const [isUploading, setIsUploading] = React.useState(false);
  // const [uploadProgress, setUploadProgress] = React.useState<{ [key: string]: number }>({});
  // const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const activeChat = useSelector((state: RootState) => state.activeChat.activeChat);
  const token = useSelector((state: RootState) => state.auth.token);
  
  const createChatMutation = useCreateChat({ token: token as string });
  
  const messageValue = watch('message', '');

  const onSubmit = async (data: FormData) => {
    console.log("submit called:", data, activeChat, token);
    
    const { message } = data;
    if (!message.trim()) return;
    
    setIsSending(true);
    
    try {
      if (activeChat === null) {
        console.log("Создание нового чата...");
        const newChat = await createChatMutation.mutateAsync();
        console.log("Новый чат создан:", newChat);
        
        dispatch(setActiveChat(newChat));
        
        const responseData = await askChat({ 
          chatId: newChat.id, 
          text: message.trim(), 
          token: token as string 
        });
        
        const sentMessage = {
          id: responseData.id,
          chat: {
            id: newChat.id,
          },
          text: message.trim(),
        }
        dispatch(addMessage(sentMessage));
        reset();
      } else {
        const responseData = await askChat({ 
          chatId: activeChat.id, 
          text: message.trim(), 
          token: token as string 
        });
        
        const sentMessage = {
          id: responseData.id,
          chat: {
            id: activeChat.id,
          },
          text: message.trim(),
        }
        dispatch(addMessage(sentMessage));
        reset();
      }
    } catch (error) {
      console.log("Ошибка при отправке сообщения:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: 'background.default',
        borderTop: '1px solid',
        borderTopColor: 'divider',
        backdropFilter: 'blur(10px)',
        background: 'linear-gradient(180deg, rgba(15, 20, 25, 0.95) 0%, rgba(15, 20, 25, 1) 100%)',
      }}
    >
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        <Paper
          elevation={3}
          sx={{
            p: 1,
            borderRadius: '28px',
            background: 'linear-gradient(135deg, rgba(26, 32, 44, 0.95) 0%, rgba(45, 55, 72, 0.95) 100%)',
            border: '1px solid',
            borderColor: 'rgba(66, 153, 225, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(66, 153, 225, 0.1)',
            backdropFilter: 'blur(20px)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              borderColor: 'rgba(66, 153, 225, 0.4)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(66, 153, 225, 0.2)',
            },
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              width: '100%',
            }}
          >
            <TextField
              {...register('message')}
              fullWidth
              multiline
              maxRows={4}
              placeholder="Спросите что-нибудь..."
              variant="outlined"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (messageValue?.trim() && !isSending) {
                    handleSubmit(onSubmit)();
                  }
                }
              }}
              disabled={isSending}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'transparent',
                  borderRadius: '20px',
                  fontSize: '0.95rem',
                  height: '40px',
                  minHeight: '40px',
                  '& fieldset': {
                    border: 'none',
                  },
                  '&:hover fieldset': {
                    border: 'none',
                  },
                  '&.Mui-focused fieldset': {
                    border: 'none',
                  },
                },
                '& .MuiInputBase-input': {
                  color: 'text.primary',
                  padding: '0 14px',
                  height: '40px',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'text.secondary',
                  opacity: 0.8,
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={!messageValue?.trim() || isSending}
              sx={{
                minWidth: 40,
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4299E1 0%, #3182CE 100%)',
                boxShadow: '0 4px 12px rgba(66, 153, 225, 0.3)',
                border: '1px solid rgba(66, 153, 225, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)',
                  boxShadow: '0 6px 20px rgba(66, 153, 225, 0.5)',
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: '0 2px 8px rgba(66, 153, 225, 0.4)',
                },
                '&:disabled': {
                  background: 'linear-gradient(135deg, #A0AEC0 0%, #718096 100%)',
                  color: '#ffffff',
                  opacity: 0.7,
                },
                transition: 'all 0.2s ease-in-out',
                flexShrink: 0,
              }}
            >
              <SendIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
