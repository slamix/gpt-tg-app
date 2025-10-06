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
      console.log(state.activeChatId);
    },
    setNewActiveChat: (state, { payload }) => {
      state.activeChatId = payload;
      sessionStorage.setItem('activeChatId', payload);
      state.isNewChat = true;
      console.log(payload);
    },
    putAwayActiveChat: (state) => {
      state.activeChatId = null;
      sessionStorage.removeItem('activeChat');
      state.isNewChat = false;
      console.log(state.activeChatId);
    }
  }
});

export const { setActiveChat, putAwayActiveChat, setNewActiveChat } = activeChatSlice.actions;
export default activeChatSlice.reducer;