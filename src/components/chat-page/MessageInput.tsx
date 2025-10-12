import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Container,
  TextField,
  Button,
  Paper,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/slices';
import { askChat } from '@/services/askChat';
import { addMessage } from '@/slices/messagesSlice';
import { useCreateChat } from '@/hooks/useCreateChat';
import { useRenameChat } from '@/hooks/useRenameChat';
import { setNewActiveChat } from '@/slices/activeChatSlice';
import { setWaitingMsg, setNotWaitingMsg, setOpenWaitingAnimation } from '@/slices/waitingMsgSlice';
import { getChatById } from '@/services/getChatById';

interface FormData {
  message: string;
}

export function MessageInput() {
  const { reset, setValue } = useForm<FormData>();
  const [isSending, setIsSending] = useState(false);
  const [messageValue, setMessageValue] = useState('');
  const textFieldRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const activeChatId = useSelector((state: RootState) => state.activeChat.activeChatId);
  
  const createChatMutation = useCreateChat();
  const renameChatMutation = useRenameChat();
  
  useEffect(() => {
    if (textFieldRef.current) {
      const textarea = textFieldRef.current.querySelector('textarea');
      if (textarea) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    }
  }, [messageValue]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageValue(value);
    setValue('message', value);
  };

  const onSubmit = async () => {    
    const message = messageValue.trim();    
    setIsSending(true);
    
    try {
      if (activeChatId === null) {
        const res = await createChatMutation.mutateAsync();
        dispatch(setNewActiveChat(res.id));

        const sentMessage = {
          chat: {
            id: activeChatId,
          },
          text: message.trim(),
        }
        dispatch(addMessage(sentMessage));
        dispatch(setOpenWaitingAnimation());
        
        await askChat({ 
          chatId: res.id, 
          text: message.trim(), 
        });

        dispatch(setWaitingMsg());
        setMessageValue('');
        reset();

        const chatMetaData = await getChatById(res.id);
        
        if (chatMetaData.chat_subject && chatMetaData.chat_subject !== 'Новый чат') {
          await renameChatMutation.mutateAsync({
            chatId: res.id,
            newSubject: chatMetaData.chat_subject,
          });
        }
        
      } else {
        const sentMessage = {
          chat: {
            id: activeChatId,
          },
          text: message.trim(),
        }
        dispatch(addMessage(sentMessage));
        dispatch(setOpenWaitingAnimation());
        
        await askChat({ 
          chatId: activeChatId, 
          text: message.trim(), 
        });

        dispatch(setWaitingMsg());
        setMessageValue('');
        reset();
      }
    } catch (error) {
      dispatch(setNotWaitingMsg());
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
            onSubmit={(e) => {
              e.preventDefault();
              if (messageValue.trim() && !isSending) {
                onSubmit();
              }
            }}
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'flex-end',
              width: '100%',
            }}
          >
            <TextField
              ref={textFieldRef}
              fullWidth
              multiline
              value={messageValue}
              onChange={handleChange}
              placeholder="Спросите что-нибудь..."
              variant="outlined"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (messageValue.trim() && !isSending) {
                    onSubmit();
                  }
                }
              }}
              disabled={isSending}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'transparent',
                  borderRadius: '20px',
                  fontSize: '0.95rem',
                  padding: 0,
                  alignItems: 'flex-start',
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
                  padding: '10px 14px',
                  minHeight: '20px',
                  maxHeight: 'calc(50vh - 100px)',
                  overflowY: 'auto !important',
                  boxSizing: 'border-box',
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(66, 153, 225, 0.3)',
                    borderRadius: '3px',
                    '&:hover': {
                      background: 'rgba(66, 153, 225, 0.5)',
                    },
                  },
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
              disabled={!messageValue.trim() || isSending}
              onClick={(e) => {
                e.preventDefault();
                if (messageValue.trim() && !isSending) {
                  onSubmit();
                }
              }}
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