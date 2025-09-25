export interface Message {
  id: number;
  chat: {
    id: number;
  },
  text: string;
  timestamp: Date;
};

export interface Chat {
  id: number;
  subject: string;
};

export interface Message {
  id: number;
  chat: {
    id: number;
  },
  text: string;
}

export type ActiveChat = Chat | null;
