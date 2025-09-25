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
    removeMessages: (state, { payload }) => {
      state.messages = state.messages.filter((message) => message.chat.id !== payload);
    }
  }
});

export const { addMessage, addMessages, removeMessages } = messagesSlice.actions;
export default messagesSlice.reducer;