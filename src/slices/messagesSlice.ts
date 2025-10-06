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
  }
});

export const { addMessage, addMessages, removeAllMessages } = messagesSlice.actions;
export default messagesSlice.reducer;