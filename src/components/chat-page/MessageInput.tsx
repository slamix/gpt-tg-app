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
import {
  Send as SendIcon,
  Add as AddIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/slices';
import { askChat } from '@/services/askChat';
import { addMessage, updateMessageId } from '@/slices/messagesSlice';
import { useCreateChat } from '@/hooks/useCreateChat';
import { setNewActiveChat } from '@/slices/activeChatSlice';
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
  const activeChatId = useSelector(
    (state: RootState) => state.activeChat.activeChatId
  );

  const chatStatus = useSelector((state: RootState) => {
    if (activeChatId === null) return null;
    return state.waitingMsg.chatsStatus[activeChatId] || null;
  });

  const messageValue = watch('message');
  const createChatMutation = useCreateChat();

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    tg.postEvent('web_app_ready');
    tg.expand();

    let rafId: number | null = null;
    let lastOffset = 0;

    const handleViewportChange = (data: any) => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        const stable = tg.viewportStableHeight ?? window.innerHeight;
        const newOffset = Math.max(0, stable - data.viewportHeight);
        
        if (Math.abs(newOffset - lastOffset) > 1) {
          lastOffset = newOffset;
          setKeyboardOffset(newOffset);
        }
      });
    };

    tg.onEvent('viewportChanged', handleViewportChange);

    setTimeout(() => {
      if (tg.viewportHeight && tg.viewportStableHeight) {
        handleViewportChange({ viewportHeight: tg.viewportHeight });
      }
    }, 50);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      tg.offEvent('viewportChanged', handleViewportChange);
    };
  }, []);

  useEffect(() => {
    if (textFieldRef.current) {
      requestAnimationFrame(() => {
        const textarea = textFieldRef.current!.querySelector('textarea');
        if (textarea) {
          textarea.scrollTop = textarea.scrollHeight;
        }
      });
    }
  }, [messageValue]);

  useEffect(() => {
    const filesToUpload = selectedFiles.filter((f) => f.status === 'new');
    if (filesToUpload.length === 0) return;

    const uploadNewFiles = async () => {
      setSelectedFiles((prev) =>
        prev.map((f) =>
          f.status === 'new' ? { ...f, status: 'uploading' as const } : f
        )
      );

      try {
        const filesArray = filesToUpload.map((f) => f.file);
        const response = await uploadFiles(filesArray);

        setSelectedFiles((prev) =>
          prev.map((fileWithStatus) => {
            if (fileWithStatus.status === 'uploading') {
              const uploadedFile = response.items?.find(
                (item: UploadedFileData) =>
                  item.name === fileWithStatus.file.name
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
        setSelectedFiles((prev) =>
          prev.map((f) =>
            f.status === 'uploading'
              ? { ...f, status: 'error' as const, error: 'Ошибка загрузки' }
              : f
          )
        );
      }
    };

    uploadNewFiles();
  }, [selectedFiles]);

  const handleAddFileClick = () => fileInputRef.current?.click();

  const getTotalFileSize = (files: FileWithStatus[]) =>
    files.reduce((total, fileWithStatus) => total + fileWithStatus.file.size, 0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);

      setSelectedFiles((prev) => {
        const uniqueNewFiles = newFiles.filter(
          (newFile) =>
            !prev.some(
              (existing) =>
                existing.file.name === newFile.name &&
                existing.file.size === newFile.size
            )
        );

        const availableSlots = 5 - prev.length;
        const filesToAdd: FileWithStatus[] = [];

        for (const file of uniqueNewFiles) {
          if (filesToAdd.length >= availableSlots) break;

          const currentTotal = getTotalFileSize([...prev, ...filesToAdd]);
          const newTotal = currentTotal + file.size;

          if (newTotal <= MAX_FILE_SIZE_BYTES) {
            filesToAdd.push({ file, status: 'new' });
          } else {
            console.warn(
              `Превышен лимит размера файлов (${MAX_FILE_SIZE_MB} МБ).`
            );
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
      setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
      if (fileToRemove.uploadedData) {
        await removeFile(fileToRemove.uploadedData.id);
      }
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
    }
  };

  const getFileIcon = (fileWithStatus: FileWithStatus) => {
    const file = fileWithStatus.file;
    if (file.type.startsWith('image/')) return <ImageIcon sx={{ fontSize: '1.2rem' }} />;
    if (file.type.startsWith('video/')) return <VideoIcon sx={{ fontSize: '1.2rem' }} />;
    return <FileIcon sx={{ fontSize: '1.2rem' }} />;
  };

  const onSubmit = async (data: FormData) => {
    const message = data.message.trim();
    const files = selectedFiles;
    if (!message) return;

    const totalSize = getTotalFileSize(files);
    if (totalSize > MAX_FILE_SIZE_BYTES) {
      console.error(`Общий размер файлов превышает ${MAX_FILE_SIZE_MB} МБ`);
      return;
    }

    const attachments = selectedFiles
      .filter((f) => f.status === 'uploaded' && f.uploadedData)
      .map((f) => ({
        id: f.uploadedData!.id,
        size: f.uploadedData!.size,
        url: f.uploadedData!.url,
        name: f.uploadedData!.name,
        type: f.uploadedData!.type,
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
          chat: { id: res.id },
          text: message,
          role: 'user',
          created_at: date.toISOString(),
          updated_at: date.toISOString(),
          has_file: attachments.length !== 0,
          attachments: attachments.length ? attachments : undefined,
        };
        dispatch(addMessage(sentMessage));

        const messageId = await askChat({
          chatId: res.id,
          text: message,
          attachments: attachments.length ? attachments : undefined,
        });

        dispatch(
          setChatStatus({ chatId: res.id, isWaitingMsg: true, status: 'polling' })
        );
        dispatch(updateMessageId(messageId.id));
      } else {
        const date = new Date();
        const sentMessage = {
          id: 'customId',
          chat: { id: activeChatId },
          text: message,
          role: 'user',
          has_file: attachments.length !== 0,
          attachments: attachments.length ? attachments : undefined,
          created_at: date.toISOString(),
          updated_at: date.toISOString(),
        };
        dispatch(addMessage(sentMessage));

        const messageId = await askChat({
          chatId: activeChatId,
          text: message,
          attachments: attachments.length ? attachments : undefined,
        });

        dispatch(
          setChatStatus({
            chatId: activeChatId,
            isWaitingMsg: true,
            status: 'polling',
          })
        );

        dispatch(updateMessageId(messageId.id));
      }
    } catch (error) {
      console.error(error);
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
        transform: `translateY(-${keyboardOffset}px)`,
        transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        willChange: keyboardOffset > 0 ? 'transform' : 'auto',
        '& > *': { pointerEvents: 'auto' },
      }}
    >
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: 3 }}>
        {selectedFiles.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              mb: 1,
              px: 1,
              py: 0.5,
              overflowX: 'auto',
              '&::-webkit-scrollbar': { display: 'none' },
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
                  background:
                    fileWithStatus.status === 'error'
                      ? 'rgba(239,68,68,0.25)'
                      : 'rgba(45,55,72,0.95)',
                  border: `1px solid ${
                    fileWithStatus.status === 'error'
                      ? 'rgba(239,68,68,0.4)'
                      : 'rgba(66,153,225,0.3)'
                  }`,
                  minWidth: '180px',
                  flexShrink: 0,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Box sx={{ color: 'rgba(66,153,225,0.9)' }}>
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
                    <Box sx={{ fontSize: '0.7rem', color: 'rgba(66,153,225,0.7)' }}>
                      Загрузка...
                    </Box>
                  )}
                  {fileWithStatus.status === 'error' && (
                    <Box sx={{ fontSize: '0.7rem', color: 'rgba(239,68,68,0.9)' }}>
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
                    color: 'rgba(239,68,68,0.8)',
                    '&:hover': {
                      color: 'rgba(239,68,68,1)',
                      backgroundColor: 'rgba(239,68,68,0.1)',
                    },
                  }}
                >
                  <CloseIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', width: '100%' }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <IconButton
            onClick={handleAddFileClick}
            disabled={
              selectedFiles.length >= 5 ||
              getTotalFileSize(selectedFiles) >= MAX_FILE_SIZE_BYTES
            }
            sx={{
              width: 46,
              height: 46,
              flexShrink: 0,
              borderRadius: '50%',
              background:
                'linear-gradient(135deg, rgba(26,32,44,0.95), rgba(45,55,72,0.95))',
              border: '1px solid rgba(66,153,225,0.3)',
              color: 'rgba(66,153,225,0.9)',
              '&:hover': {
                color: 'rgba(66,153,225,1)',
                borderColor: 'rgba(66,153,225,0.5)',
              },
            }}
          >
            <AddIcon sx={{ fontSize: '1.4rem' }} />
          </IconButton>

          <Paper
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            elevation={3}
            sx={{
              flex: 1,
              display: 'flex',
              gap: 0.5,
              alignItems: 'flex-end',
              px: 1.5,
              py: 0.5,
              borderRadius: '21px',
              background:
                'linear-gradient(135deg, rgba(26,32,44,0.95), rgba(45,55,72,0.95))',
              border: '1px solid rgba(66,153,225,0.2)',
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
                  '& fieldset': { border: 'none' },
                },
                '& .MuiInputBase-input': {
                  color: 'text.primary',
                  padding: '8px 0',
                  lineHeight: '1.5',
                  maxHeight: '120px',
                  overflowY: 'auto !important',
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={
                !messageValue?.trim() ||
                chatStatus?.isWaitingMsg ||
                selectedFiles.some((f) => f.status === 'uploading' || f.status === 'new')
              }
              sx={{
                minWidth: 32,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background:
                  'linear-gradient(135deg, #4299E1 0%, #3182CE 100%)',
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
