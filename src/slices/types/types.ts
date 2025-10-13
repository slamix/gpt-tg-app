export interface Message {
  id?: number;
  chat: {
    id: number;
  },
  text: string;
  hasFile?: boolean;
  created_at: string;
  updated_at: string;
};

export interface Chat {
  id: number;
  owner_id: number;
  chat_subject: string;
};

export type ActiveChat = Chat | null;
