import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Container,
  TextField,
  Button,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import { Send as SendIcon, Add as AddIcon, Close as CloseIcon, InsertDriveFile as FileIcon, Image as ImageIcon, VideoLibrary as VideoIcon, PhotoLibrary as GalleryIcon } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/slices';
import { askChat } from '@/services/askChat';
import { addMessage, updateMessageId } from '@/slices/messagesSlice';
import { setIsSending } from '@/slices/waitingMsgSlice';
import { useCreateChat } from '@/hooks/useCreateChat';
import { useRenameChat } from '@/hooks/useRenameChat';
import { setNewActiveChat } from '@/slices/activeChatSlice';
import { setWaitingMsg, setNotWaitingMsg, setOpenWaitingAnimation } from '@/slices/waitingMsgSlice';
import { getChatById } from '@/services/getChatById';
import { uploadFiles } from '@/services/uploadFiles';
import { removeFile } from '@/services/removeFiles';

interface FormData {
  message: string;
}

interface UploadedFileData {
  id: number;
  url: string;
  name: string;
  size: number;
  type: string;
  sha256: string;
}

interface FileWithStatus {
  file: File;
  status: 'new' | 'uploading' | 'uploaded' | 'error';
  uploadedData?: UploadedFileData;
  error?: string;
}

const MAX_FILE_SIZE_MB = 256;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function MessageInput() {
  const { register, handleSubmit, watch, reset } = useForm<FormData>({
    defaultValues: { message: '' },
    mode: 'onChange',
  });
  const isSending = useSelector((state: RootState) => state.waitingMsg.isSending);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileWithStatus[]>([]);
  const textFieldRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const activeChatId = useSelector((state: RootState) => state.activeChat.activeChatId);
  
  const messageValue = watch('message');
  
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

  useEffect(() => {
    const filesToUpload = selectedFiles.filter(f => f.status === 'new');
    
    if (filesToUpload.length === 0) return;

    const uploadNewFiles = async () => {
      setSelectedFiles(prev => 
        prev.map(f => 
          f.status === 'new' ? { ...f, status: 'uploading' as const } : f
        )
      );

      try {
        const filesArray = filesToUpload.map(f => f.file);
        const response = await uploadFiles(filesArray);
        
        console.log('Файлы загружены:', response);

        setSelectedFiles(prev => 
          prev.map(fileWithStatus => {
            if (fileWithStatus.status === 'uploading') {
              const uploadedFile = response.items?.find(
                (item: UploadedFileData) => item.name === fileWithStatus.file.name
              );
              
              if (uploadedFile) {
                return {
                  ...fileWithStatus,
                  status: 'uploaded' as const,
                  uploadedData: uploadedFile,
                };
              } else {
                return {
                  ...fileWithStatus,
                  status: 'error' as const,
                  error: 'Файл не найден в ответе сервера',
                };
              }
            }
            return fileWithStatus;
          })
        );
      } catch (error) {
        console.error('Ошибка загрузки файлов:', error);
        
        setSelectedFiles(prev => 
          prev.map(f => 
            f.status === 'uploading' 
              ? { ...f, status: 'error' as const, error: 'Ошибка загрузки' } 
              : f
          )
        );
      }
    };

    uploadNewFiles();
  }, [selectedFiles]);
  
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleFileClick = () => {
    handleCloseMenu();
    fileInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    handleCloseMenu();
    galleryInputRef.current?.click();
  };

  const getTotalFileSize = (files: FileWithStatus[]): number => {
    return files.reduce((total, fileWithStatus) => total + fileWithStatus.file.size, 0);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      
      setSelectedFiles(prev => {
        const uniqueNewFiles = newFiles.filter(newFile => {
          return !prev.some(existingFileWithStatus => 
            existingFileWithStatus.file.name === newFile.name && 
            existingFileWithStatus.file.size === newFile.size
          );
        });
        
        const availableSlots = 5 - prev.length;
        let filesToAdd: FileWithStatus[] = [];
        
        for (const file of uniqueNewFiles) {
          if (filesToAdd.length >= availableSlots) break;
          
          const currentTotalSize = getTotalFileSize([...prev, ...filesToAdd]);
          const newTotalSize = currentTotalSize + file.size;
          
          if (newTotalSize <= MAX_FILE_SIZE_BYTES) {
            filesToAdd.push({
              file,
              status: 'new',
            });
          } else {
            console.warn(`Превышен лимит размера файлов (${MAX_FILE_SIZE_MB} МБ). Файл "${file.name}" не добавлен.`);
            break;
          }
        }
        
        return [...prev, ...filesToAdd];
      });
    }
    event.target.value = '';
  };

  const handleRemoveFile = async (index: number) => {
    try {
      const fileToRemove = selectedFiles[index];
      if (fileToRemove.uploadedData) {
        await removeFile(fileToRemove.uploadedData.id);
      }
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
    } finally {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const getFileIcon = (fileWithStatus: FileWithStatus) => {
    const file = fileWithStatus.file;
    if (file.type.startsWith('image/')) {
      return <ImageIcon sx={{ fontSize: '1.2rem' }} />;
    } else if (file.type.startsWith('video/')) {
      return <VideoIcon sx={{ fontSize: '1.2rem' }} />;
    } else {
      return <FileIcon sx={{ fontSize: '1.2rem' }} />;
    }
  };

  const onSubmit = async (data: FormData) => {
    const message = data.message.trim();
    const files = selectedFiles;
    
    if (!message) {
      return;
    }
    
    const totalSize = getTotalFileSize(files);
    if (totalSize > MAX_FILE_SIZE_BYTES) {
      console.error(`Общий размер файлов превышает ${MAX_FILE_SIZE_MB} МБ`);
      return;
    }
    const attachments = selectedFiles
      .filter(f => f.status === 'uploaded' && f.uploadedData)
      .map(f => ({
        id: f.uploadedData!.id,
        size: f.uploadedData!.size,
        url: f.uploadedData!.url,
        name: f.uploadedData!.name,
        type: f.uploadedData!.type
      }));
    setSelectedFiles([]);
    reset();
    dispatch(setIsSending(true));
    
    try {
      if (activeChatId === null) {
        const res = await createChatMutation.mutateAsync();
        dispatch(setNewActiveChat(res.id));

        const date = new Date();

        const sentMessage = {
          id: 'customId',
          chat: {
            id: activeChatId,
          },
          text: message.trim(),
          role: 'user',
          created_at: date.toISOString(),
          updated_at: date.toISOString(),
          has_file: attachments.length !== 0,
          attachments: attachments.length !== 0 ? attachments : undefined,
        }
        dispatch(addMessage(sentMessage));
        dispatch(setOpenWaitingAnimation());
        
        const messageId = await askChat({ 
          chatId: res.id, 
          text: message.trim(),
          attachments: attachments.length !== 0 ? attachments : undefined,
        });

        dispatch(updateMessageId(messageId.id));
        dispatch(setWaitingMsg());
        
        const chatMetaData = await getChatById(res.id);
        
        if (chatMetaData.chat_subject && chatMetaData.chat_subject !== 'Новый чат') {
          await renameChatMutation.mutateAsync({
            chatId: res.id,
            newSubject: chatMetaData.chat_subject,
          });
        }
        
      } else {
        const date = new Date();
        const sentMessage = {
          id: 'customId',
          chat: {
            id: activeChatId,
          },
          text: message.trim(),
          role: 'user',
          has_file: attachments.length !== 0,
          attachments: attachments.length !== 0 ? attachments : undefined,
          created_at: date.toISOString(),
          updated_at: date.toISOString(),
        }
        dispatch(addMessage(sentMessage));
        dispatch(setOpenWaitingAnimation());
        
        const messageId = await askChat({ 
          chatId: activeChatId, 
          text: message.trim(),
          attachments: attachments.length !== 0 ? attachments : undefined,
        });

        dispatch(updateMessageId(messageId.id));
        dispatch(setWaitingMsg());
      }
    } catch (error) {
      dispatch(setNotWaitingMsg());
    } finally {
      dispatch(setIsSending(false));
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
          {/* Отображение выбранных файлов */}
          {selectedFiles.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                mb: 1,
                px: 1,
                py: 0.5,
                overflowX: 'auto',
                overflowY: 'hidden',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              {selectedFiles.map((fileWithStatus, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: '12px',
                    background: fileWithStatus.status === 'uploading' 
                      ? 'rgba(66, 153, 225, 0.05)' 
                      : fileWithStatus.status === 'uploaded' 
                      ? 'rgba(66, 153, 225, 0.15)' 
                      : fileWithStatus.status === 'error' 
                      ? 'rgba(239, 68, 68, 0.15)' 
                      : 'rgba(66, 153, 225, 0.1)',
                    border: `1px solid ${
                      fileWithStatus.status === 'uploading' 
                        ? 'rgba(66, 153, 225, 0.2)' 
                        : fileWithStatus.status === 'uploaded' 
                        ? 'rgba(66, 153, 225, 0.3)' 
                        : fileWithStatus.status === 'error' 
                        ? 'rgba(239, 68, 68, 0.3)' 
                        : 'rgba(66, 153, 225, 0.2)'
                    }`,
                    minWidth: '180px',
                    maxWidth: '200px',
                    flexShrink: 0,
                  }}
                >
                  <Box sx={{ color: 'rgba(66, 153, 225, 0.9)', display: 'flex', alignItems: 'center' }}>
                    {getFileIcon(fileWithStatus)}
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.25,
                    }}
                  >
                    <Box
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.85rem',
                        color: 'text.primary',
                      }}
                    >
                      {fileWithStatus.file.name}
                    </Box>
                    {fileWithStatus.status === 'uploading' && (
                      <Box sx={{ fontSize: '0.7rem', color: 'rgba(66, 153, 225, 0.7)' }}>
                        Загрузка...
                      </Box>
                    )}
                    {fileWithStatus.status === 'error' && (
                      <Box sx={{ fontSize: '0.7rem', color: 'rgba(239, 68, 68, 0.9)' }}>
                        Ошибка загрузки
                      </Box>
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveFile(index)}
                    sx={{
                      width: 20,
                      height: 20,
                      color: 'rgba(239, 68, 68, 0.8)',
                      '&:hover': {
                        color: 'rgba(239, 68, 68, 1)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'flex-end',
              width: '100%',
            }}
          >
            {/* Скрытые input элементы для выбора файлов */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <input
              ref={galleryInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Badge
              key={selectedFiles.length}
              badgeContent={selectedFiles.length > 0 ? `${selectedFiles.length}/5` : 0}
              invisible={selectedFiles.length === 0}
              sx={{
                alignSelf: 'flex-end',
                '& .MuiBadge-badge': {
                  backgroundColor: (selectedFiles.length >= 5 || getTotalFileSize(selectedFiles) >= MAX_FILE_SIZE_BYTES) 
                    ? 'rgba(239, 68, 68, 0.9)' 
                    : 'rgba(66, 153, 225, 0.9)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  height: '18px',
                  minWidth: '30px',
                  borderRadius: '9px',
                },
              }}
            >
              <IconButton
                onClick={handleOpenMenu}
                disabled={selectedFiles.length >= 5 || getTotalFileSize(selectedFiles) >= MAX_FILE_SIZE_BYTES}
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  color: 'rgba(66, 153, 225, 0.8)',
                  '&:hover': {
                    color: 'rgba(66, 153, 225, 1)',
                    backgroundColor: 'rgba(66, 153, 225, 0.1)',
                  },
                  '&:disabled': {
                    color: 'rgba(160, 174, 192, 0.5)',
                  },
                }}
              >
                <AddIcon />
              </IconButton>
            </Badge>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              sx={{
                '& .MuiPaper-root': {
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(26, 32, 44, 0.98) 0%, rgba(45, 55, 72, 0.98) 100%)',
                  border: '1px solid rgba(66, 153, 225, 0.2)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(20px)',
                  minWidth: '140px',
                },
              }}
            >
              <MenuItem 
                onClick={handleFileClick}
                sx={{
                  color: 'text.primary',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  '&:hover': {
                    backgroundColor: 'rgba(66, 153, 225, 0.15)',
                  },
                }}
              >
                <FileIcon sx={{ fontSize: '1.2rem' }} />
                Файл
              </MenuItem>
              <MenuItem 
                onClick={handleGalleryClick}
                sx={{
                  color: 'text.primary',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  '&:hover': {
                    backgroundColor: 'rgba(66, 153, 225, 0.15)',
                  },
                }}
              >
                <GalleryIcon sx={{ fontSize: '1.2rem' }} />
                Галерея
              </MenuItem>
            </Menu>
            <TextField
              {...register('message')}
              inputRef={textFieldRef}
              fullWidth
              multiline
              placeholder="Спросите что-нибудь..."
              variant="outlined"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(onSubmit)();
                }
              }}
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
                  maxHeight: 'calc(30vh - 60px)',
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
              disabled={
                !messageValue?.trim() ||
                isSending || 
                selectedFiles.some(f => f.status === 'uploading' || f.status === 'new')
              }
              sx={{
                minWidth: 40,
                width: 40,
                height: 40,
                alignSelf: 'flex-end',
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