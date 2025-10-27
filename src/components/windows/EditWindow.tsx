import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, InsertDriveFile as FileIcon, Image as ImageIcon, VideoLibrary as VideoIcon, PhotoLibrary as GalleryIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { editMessage } from '@/services/editMessage';
import { redactMessage } from '@/slices/messagesSlice';
import { setIsSending, setOpenWaitingAnimation, setWaitingMsg } from '@/slices/waitingMsgSlice';
import { uploadFiles } from '@/services/uploadFiles';
import { removeFile } from '@/services/removeFiles';

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

interface ExistingAttachment {
  id: number;
  url: string;
  name: string;
  size: number;
  type: string;
}

interface EditWindowProps {
  messageId: number;
  onCancel: () => void;
  onSave: () => void;
  editedText: string;
  setEditedText: (text: string) => void;
  initialAttachments?: ExistingAttachment[];
}

const MAX_FILE_SIZE_MB = 256;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function EditWindow({ messageId, onCancel, onSave, editedText, setEditedText, initialAttachments = [] }: EditWindowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  
  const [existingFiles, setExistingFiles] = useState<ExistingAttachment[]>(initialAttachments);
  const [newFiles, setNewFiles] = useState<FileWithStatus[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    setExistingFiles(initialAttachments);
  }, [initialAttachments]);

  useEffect(() => {
    const filesToUpload = newFiles.filter(f => f.status === 'new');
    
    if (filesToUpload.length === 0) return;

    const uploadNewFiles = async () => {
      setNewFiles(prev => 
        prev.map(f => 
          f.status === 'new' ? { ...f, status: 'uploading' as const } : f
        )
      );

      try {
        const filesArray = filesToUpload.map(f => f.file);
        const response = await uploadFiles(filesArray);
        
        setNewFiles(prev => 
          prev.map(fileWithStatus => {
            if (fileWithStatus.status === 'uploading') {
              const uploadedFile = response.items?.find(
                (uploaded: UploadedFileData) => uploaded.name === fileWithStatus.file.name
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
        
        setNewFiles(prev => 
          prev.map(f => 
            f.status === 'uploading' 
              ? { ...f, status: 'error' as const, error: 'Ошибка загрузки' } 
              : f
          )
        );
      }
    };

    uploadNewFiles();
  }, [newFiles]);

  const getTotalFileSize = (files: FileWithStatus[]): number => {
    return files.reduce((total, fileWithStatus) => total + fileWithStatus.file.size, 0);
  };

  const getTotalFilesCount = (): number => {
    return existingFiles.length + newFiles.length;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon sx={{ fontSize: '1.2rem' }} />;
    } else if (type.startsWith('video/')) {
      return <VideoIcon sx={{ fontSize: '1.2rem' }} />;
    } else {
      return <FileIcon sx={{ fontSize: '1.2rem' }} />;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    setNewFiles((prev) => {
      const totalFiles = getTotalFilesCount();
      if (totalFiles + files.length > 5) {
        return prev;
      }
      
      const existingFileNames = new Set([
        ...existingFiles.map(f => f.name),
        ...prev.map(f => f.file.name)
      ]);
      
      const filesToAdd: FileWithStatus[] = [];
      
      for (const file of files) {
        if (existingFileNames.has(file.name)) {
          console.warn(`Файл с именем "${file.name}" уже прикреплен.`);
          continue;
        }
        
        const newTotalSize = getTotalFileSize([...prev, ...filesToAdd]) + file.size;
        
        if (newTotalSize <= MAX_FILE_SIZE_BYTES) {
          filesToAdd.push({
            file,
            status: 'new',
          });
          existingFileNames.add(file.name);
        } else {
          console.warn(`Превышен лимит размера файлов (${MAX_FILE_SIZE_MB} МБ). Файл "${file.name}" не добавлен.`);
          break;
        }
      }
      
      return [...prev, ...filesToAdd];
    });
    
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemoveExistingFile = async (index: number) => {
    const fileToRemove = existingFiles[index];
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
    try {
      await removeFile(fileToRemove.id);
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
    }
  };

  const handleRemoveNewFile = async (index: number) => {
      setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
    handleCloseMenu();
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
    handleCloseMenu();
  };

  const handleSave = async () => {
    if (editedText.trim() === '') {
      return;
    }

    const allAttachments = [
      ...existingFiles,
      ...newFiles
        .filter(f => f.status === 'uploaded' && f.uploadedData)
        .map(f => ({
          id: f.uploadedData!.id,
          url: f.uploadedData!.url,
          name: f.uploadedData!.name,
          size: f.uploadedData!.size,
          type: f.uploadedData!.type,
        }))
    ];

    try {
      const now = new Date();
      onSave();
      dispatch(redactMessage({ messageId, newText: editedText, updatedAt: now.toISOString(), attachments: allAttachments }));
      dispatch(setIsSending(true));
      dispatch(setOpenWaitingAnimation());
      await editMessage({ messageId, newText: editedText, attachments: allAttachments });
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

        {/* Отображение файлов */}
        {(existingFiles.length > 0 || newFiles.length > 0) && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              mb: 2,
              overflowX: 'auto',
              overflowY: 'hidden',
              pb: 1,
              '&::-webkit-scrollbar': {
                height: '6px',
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
            {/* Существующие файлы сообщения */}
            {existingFiles.map((file, index) => (
              <Box
                key={`existing-${file.id}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: '12px',
                  background: 'rgba(66, 153, 225, 0.15)',
                  border: '1px solid rgba(66, 153, 225, 0.3)',
                  minWidth: '180px',
                  maxWidth: '200px',
                  flexShrink: 0,
                }}
              >
                <Box sx={{ color: 'rgba(66, 153, 225, 0.9)', display: 'flex', alignItems: 'center' }}>
                  {getFileIcon(file.type)}
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
                    {file.name}
                  </Box>
                  <Box sx={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {(file.size / 1024).toFixed(2)} KB
                  </Box>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveExistingFile(index)}
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
            
            {/* Новые загруженные файлы */}
            {newFiles.map((fileWithStatus, index) => (
              <Box
                key={`new-${index}`}
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
                  {getFileIcon(fileWithStatus.file.type)}
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
                  {fileWithStatus.status === 'uploaded' && (
                    <Box sx={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                      {(fileWithStatus.file.size / 1024).toFixed(2)} KB
                    </Box>
                  )}
                </Box>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveNewFile(index)}
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

        {/* Текстовое поле */}
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

        {/* Меню выбора типа файлов */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          PaperProps={{
            sx: {
              backgroundColor: 'rgba(45, 55, 72, 0.98)',
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

        {/* Кнопки */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Кнопка добавления файлов */}
          <Badge
            badgeContent={getTotalFilesCount()}
            color="secondary"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.65rem',
                height: 16,
                minWidth: 16,
                padding: '0 4px',
              },
            }}
          >
            <IconButton
              onClick={handleOpenMenu}
              disabled={getTotalFilesCount() >= 5 || getTotalFileSize(newFiles) >= MAX_FILE_SIZE_BYTES}
              sx={{
                width: 36,
                height: 36,
                color: 'rgba(66, 153, 225, 0.8)',
                backgroundColor: 'rgba(66, 153, 225, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(66, 153, 225, 0.2)',
                  color: 'rgba(66, 153, 225, 1)',
                },
                '&:disabled': {
                  color: 'rgba(66, 153, 225, 0.3)',
                  backgroundColor: 'rgba(66, 153, 225, 0.05)',
                },
              }}
            >
              <AddIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          </Badge>

          {/* Кнопки отмены и отправки */}
          <Box sx={{ display: 'flex', gap: 1 }}>
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
              disabled={editedText.trim() === '' || newFiles.some(f => f.status === 'uploading' || f.status === 'new')}
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
        </Box>
      </Paper>
    </Box>
  );
}
