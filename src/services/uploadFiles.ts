import { api } from "@/api/axiosInstance";

export async function uploadFiles(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('file', file);
  });
  const { data } = await api.post('files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });

  return data;
}