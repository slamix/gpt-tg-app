import { createSlice } from "@reduxjs/toolkit";

type PollingStatus = 'polling' | 'gotMsg';

interface ChatStatus {
    isWaitingMsg: boolean; // for disable buttons and open animation of waiting
    status: PollingStatus; // polling - looking for response of assistant, gotMsg - got response of assistant
}

// TODO: work with animation of waiting, wanna to open it earlier

interface stateInterface {
    chatsStatus: Record<number, ChatStatus>
}

const initialState: stateInterface = {
    chatsStatus: {},
}

const waitingMsgSlice = createSlice({
  name: 'testWait',
  initialState,
  reducers: {
    setChatStatus: (state, { payload }) => {
      const { chatId, isWaitingMsg, status } = payload;
      state.chatsStatus[chatId] = {
        isWaitingMsg,
        status,
      }
    },
  }
});

export default waitingMsgSlice.reducer;
export const { setChatStatus } = waitingMsgSlice.actions;