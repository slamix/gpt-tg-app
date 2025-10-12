import { createSlice } from '@reduxjs/toolkit';

interface ActiveChatState {
  activeChatId: number | null;
  isNewChat: boolean;
}

const initialState: ActiveChatState = {
  activeChatId: sessionStorage.getItem('activeChatId') ? Number(sessionStorage.getItem('activeChatId')): null,
  isNewChat: false,
}

const activeChatSlice = createSlice({
  name: 'activeChat',
  initialState,
  reducers: {
    setActiveChat: (state, { payload }) => {
      state.activeChatId = payload;
      sessionStorage.setItem('activeChatId', payload);
      state.isNewChat = false;
    },
    setNewActiveChat: (state, { payload }) => {
      state.activeChatId = payload;
      sessionStorage.setItem('activeChatId', payload);
      state.isNewChat = true;
    },
    putAwayActiveChat: (state) => {
      state.activeChatId = null;
      sessionStorage.removeItem('activeChatId');
      state.isNewChat = false;
    }
  }
});

export const { setActiveChat, putAwayActiveChat, setNewActiveChat } = activeChatSlice.actions;
export default activeChatSlice.reducer;