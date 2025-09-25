import { createSlice } from '@reduxjs/toolkit';
import type { ActiveChat } from '@/slices/types/types';

interface ActiveChatState {
  activeChat: ActiveChat;
}

const initialState: ActiveChatState = {
  activeChat: null,
}

const activeChatSlice = createSlice({
  name: 'activeChat',
  initialState,
  reducers: {
    setActiveChat: (state, { payload }) => {
      state.activeChat = payload;
    },
    putAwayActiveChat: (state) => {
      state.activeChat = null;
    }
  }
});

export const { setActiveChat, putAwayActiveChat } = activeChatSlice.actions;
export default activeChatSlice.reducer;