import { Box, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { putAwayActiveChat } from '@/slices/activeChatSlice';
import { removeAllMessages } from '@/slices/messagesSlice';

interface NewChatButtonProps {
  onMobileClose?: () => void;
}

export function NewChatButton( { onMobileClose }: NewChatButtonProps ) {
  const dispatch = useDispatch();
  const handleNewChat = () => {
    if (onMobileClose) {
      onMobileClose();
    }
    dispatch(putAwayActiveChat());
    dispatch(removeAllMessages());
  }
  
  return (
    <Box sx={{ p: 2 }}>
      <Button
        fullWidth
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleNewChat}
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
  );
}
