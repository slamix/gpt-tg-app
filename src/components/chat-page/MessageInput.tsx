import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Container,
  TextField,
  Button,
  Paper,
  IconButton,
} from '@mui/material';
import { Send as SendIcon, Add as AddIcon, Close as CloseIcon, InsertDriveFile as FileIcon, Image as ImageIcon, VideoLibrary as VideoIcon } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/slices';
import { askChat } from '@/services/askChat';
import { addMessage, updateMessageId } from '@/slices/messagesSlice';
import { useCreateChat } from '@/hooks/useCreateChat';
import { useRenameChat } from '@/hooks/useRenameChat';
import { setNewActiveChat } from '@/slices/activeChatSlice';
import { getChatById } from '@/services/getChatById';
import { uploadFiles } from '@/services/uploadFiles';
import { removeFile } from '@/services/removeFiles';
import { setChatStatus } from '@/slices/waitingMsgSlice';

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
  const [selectedFiles, setSelectedFiles] = useState<FileWithStatus[]>([]);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const textFieldRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const activeChatId = useSelector((state: RootState) => state.activeChat.activeChatId);
  
  const chatStatus = useSelector((state: RootState) => {
    if (activeChatId === null) return null;
    return state.waitingMsg.chatsStatus[activeChatId] || null;
  });
  
  const messageValue = watch('message');
  
  const createChatMutation = useCreateChat();
  const renameChatMutation = useRenameChat();

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isAndroid = /Android/i.test(userAgent);
    const isMobile = isIOS || isAndroid;
    
    if (!isMobile) return;

    if (isIOS) {
      const handleFocusIn = (e: FocusEvent) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLElement;
        
        if (
          ((target && /input|textarea/i.test(target.tagName)) ||
            target.contentEditable === 'true') &&
          !target.dataset.hack
        ) {
          target.dataset.hack = '1';
          const originalGetBoundingClientRect = target.getBoundingClientRect;
          
          target.getBoundingClientRect = function() {
            const result = originalGetBoundingClientRect.call(target);
            
            if (document.activeElement === target) {
              return {
                ...result,
                top: 0,
                bottom: result.bottom,
                height: result.height,
                width: result.width,
                left: result.left,
                right: result.right,
                x: result.x,
                y: 0,
                toJSON: result.toJSON,
              } as DOMRect;
            }
            
            return result;
          };
        }
      };

      document.addEventListener('focusin', handleFocusIn);
      
      return () => {
        document.removeEventListener('focusin', handleFocusIn);
      };
    }

    const handleResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const offset = windowHeight - viewportHeight;
        setKeyboardOffset(offset > 0 ? offset : 0);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, []);
  
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
  
  const handleAddFileClick = () => {
    fileInputRef.current?.click();
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
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
      if (fileToRemove.uploadedData) {
        await removeFile(fileToRemove.uploadedData.id);
      }
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
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
    
    try {
      if (activeChatId === null) {
        const res = await createChatMutation.mutateAsync();
        dispatch(setNewActiveChat(res.id));

        const date = new Date();

        const sentMessage = {
          id: 'customId',
          chat: {
            id: res.id,
          },
          text: message.trim(),
          role: 'user',
          created_at: date.toISOString(),
          updated_at: date.toISOString(),
          has_file: attachments.length !== 0,
          attachments: attachments.length !== 0 ? attachments : undefined,
        }
        dispatch(addMessage(sentMessage));
        
        const messageId = await askChat({ 
          chatId: res.id, 
          text: message.trim(),
          attachments: attachments.length !== 0 ? attachments : undefined,
        });

        dispatch(setChatStatus({ chatId: res.id, isWaitingMsg: true, status: 'polling' }));
        dispatch(updateMessageId(messageId.id));
        
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
        
        const messageId = await askChat({ 
          chatId: activeChatId, 
          text: message.trim(),
          attachments: attachments.length !== 0 ? attachments : undefined,
        });

        dispatch(setChatStatus({ chatId: activeChatId, isWaitingMsg: true, status: 'polling' }));

        dispatch(updateMessageId(messageId.id));
      }
    } catch (error) {
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        pointerEvents: 'none',
        transform: keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : 'none',
        transition: 'transform 0.3s ease-out',
        '& > *': {
          pointerEvents: 'auto',
        },
      }}
    >
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: 3 }}>
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
                    ? 'rgba(45, 55, 72, 0.95)' 
                    : fileWithStatus.status === 'uploaded' 
                    ? 'rgba(66, 153, 225, 0.25)' 
                    : fileWithStatus.status === 'error' 
                    ? 'rgba(239, 68, 68, 0.25)' 
                    : 'rgba(45, 55, 72, 0.95)',
                  border: `1px solid ${
                    fileWithStatus.status === 'uploading' 
                      ? 'rgba(66, 153, 225, 0.3)' 
                      : fileWithStatus.status === 'uploaded' 
                      ? 'rgba(66, 153, 225, 0.4)' 
                      : fileWithStatus.status === 'error' 
                      ? 'rgba(239, 68, 68, 0.4)' 
                      : 'rgba(66, 153, 225, 0.3)'
                  }`,
                  minWidth: '180px',
                  maxWidth: '200px',
                  flexShrink: 0,
                  backdropFilter: 'blur(10px)',
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
          sx={{
            display: 'flex',
            gap: 1.5,
            alignItems: 'flex-end',
            width: '100%',
          }}
        >
          {/* Скрытый input для выбора файлов */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          
          {/* Кнопка добавления файла (слева) */}
          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={handleAddFileClick}
              disabled={selectedFiles.length >= 5 || getTotalFileSize(selectedFiles) >= MAX_FILE_SIZE_BYTES}
              sx={{
                width: 46,
                height: 46,
                flexShrink: 0,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(26, 32, 44, 0.95) 0%, rgba(45, 55, 72, 0.95) 100%)',
                border: '1px solid rgba(66, 153, 225, 0.3)',
                color: 'rgba(66, 153, 225, 0.9)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  color: 'rgba(66, 153, 225, 1)',
                  borderColor: 'rgba(66, 153, 225, 0.5)',
                  background: 'linear-gradient(135deg, rgba(26, 32, 44, 1) 0%, rgba(45, 55, 72, 1) 100%)',
                },
                '&:disabled': {
                  color: 'rgba(160, 174, 192, 0.5)',
                  borderColor: 'rgba(160, 174, 192, 0.2)',
                  background: 'rgba(26, 32, 44, 0.5)',
                },
              }}
            >
              <AddIcon sx={{ fontSize: '1.4rem' }} />
            </IconButton>
            {selectedFiles.length >= 5 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  fontSize: '0.75rem',
                  color: '#fff',
                  fontWeight: 700,
                  backgroundColor: 'rgba(239, 68, 68, 0.95)',
                  borderRadius: '10px',
                  px: 0.75,
                  py: 0.25,
                  border: '2px solid rgba(15, 20, 25, 1)',
                }}
              >
                5/5
              </Box>
            )}
          </Box>
          
          {/* Овал с инпутом и кнопкой отправки (справа) */}
          <Paper
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            elevation={3}
            sx={{
              flex: 1,
              display: 'flex',
              gap: 0.5,
              alignItems: 'flex-end',
              minHeight: 42,
              px: 1.5,
              py: 0.5,
              borderRadius: '21px',
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
                  padding: '8px 0',
                  lineHeight: '1.5',
                  maxHeight: '120px',
                  overflowY: 'auto !important',
                  boxSizing: 'border-box',
                  '&::-webkit-scrollbar': {
                    width: '4px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(66, 153, 225, 0.3)',
                    borderRadius: '2px',
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
                chatStatus?.isWaitingMsg || 
                selectedFiles.some(f => f.status === 'uploading' || f.status === 'new')
              }
              sx={{
                minWidth: 32,
                width: 32,
                height: 32,
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
                mb: 0.25,
              }}
            >
              <SendIcon sx={{ color: '#fff', fontSize: '1.1rem' }} />
            </Button>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}