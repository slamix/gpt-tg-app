export interface Message {
  id?: number;
  chat: {
    id: number;
  },
  text: string;
  role: string;
  has_file?: boolean;
  attachments?: {
    name: string;
    type: string;
    size: number;
    url: string;
  }[] | null;
  created_at: string;
  updated_at: string;
};

export interface Chat {
  id: number;
  owner_id: number;
  chat_subject: string;
};

export type ActiveChat = Chat | null;
