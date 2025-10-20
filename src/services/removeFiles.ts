import { api } from '@/api/axiosInstance';

export async function removeFile(fileId: number) {
  await api.delete(`files/${fileId}`);
}
