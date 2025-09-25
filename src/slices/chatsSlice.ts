import { createSlice } from '@reduxjs/toolkit';
import type { Chat } from '@/slices/types/types';

interface ChatsState {
  chats: Chat[];
}

const initialState: ChatsState = {
  chats: [],
}

const chatsSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    addChats: (state, { payload }) => {
      state.chats = payload;
    },
    addChat: (state, { payload }) => {
      state.chats.push(payload);
    },
    removeChat: (state, { payload }) => {
      state.chats = state.chats.filter((chat) => chat.id !== payload);
    }
  }
})

export const { addChats, addChat, removeChat } = chatsSlice.actions;
export default chatsSlice.reducer;