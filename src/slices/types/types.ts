export interface Message {
  id: number;
  chat: {
    id: number;
  },
  text: string;
  //timestamp: string; // Изменено с Date на string для сериализации
};

export interface Chat {
  id: number;
  owner_id: number;
  chat_subject: string;
};

export type ActiveChat = Chat | null;
