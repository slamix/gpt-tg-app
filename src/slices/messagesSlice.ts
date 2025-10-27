import { createSlice } from '@reduxjs/toolkit';
import type { Message } from '@/slices/types/types';

interface MessagesState {
    messages: Message[];
}

const initialState: MessagesState = {
    messages: [],
}

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessages: (state, { payload }) => {
      state.messages = payload;
    },
    addMessage: (state, { payload }) => {
      state.messages.push(payload);
    },
    removeAllMessages: (state) => {
      state.messages = [];
    },
    updateMessageId: (state, { payload }) => {
      state.messages = state.messages.map((message) => {
        if (message.id === 'customId') {
          message.id = payload;
          return message;
        }
        return message;
      });
    },
    redactMessage: (state, { payload }) => {
      const { messageId, newText, updatedAt, attachments } = payload;
      const messages: Message[] = [];
      for (let message of state.messages) {
        if (message.id === messageId) {
          messages.push({ ...message, text: newText, updated_at: updatedAt, attachments: attachments });
          break;
        }
        messages.push(message);
      }
      state.messages = messages;
    }
  }
});

export const { addMessage, addMessages, removeAllMessages, redactMessage, updateMessageId } = messagesSlice.actions;
export default messagesSlice.reducer;