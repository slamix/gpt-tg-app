import { createSlice } from '@reduxjs/toolkit';
import type { ActiveChat } from '@/slices/types/types';

interface ActiveChatState {
  activeChat: ActiveChat;
}

const raw = typeof window !== 'undefined'
  ? sessionStorage.getItem('activeChat')
  : null;

const initialState: ActiveChatState = {
  activeChat: raw ? JSON.parse(raw) : null,
}

const activeChatSlice = createSlice({
  name: 'activeChat',
  initialState,
  reducers: {
    setActiveChat: (state, { payload }) => {
      state.activeChat = payload;
      sessionStorage.setItem('activeChat', JSON.stringify(payload));
    },
    putAwayActiveChat: (state) => {
      state.activeChat = null;
      sessionStorage.removeItem('activeChat');
    }
  }
});

export const { setActiveChat, putAwayActiveChat } = activeChatSlice.actions;
export default activeChatSlice.reducer;