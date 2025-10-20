import { createSlice } from "@reduxjs/toolkit";

interface WaitingMsgState {
  isWaitingMsg: boolean;
  openWaitingAnimation: boolean;
  isSending: boolean;
}

const initialState: WaitingMsgState = {
  isWaitingMsg: sessionStorage.getItem('isWaitingMsg') === 'true' ? true : false,
  openWaitingAnimation: false,
  isSending: false,
}

const waitingMsgSlice = createSlice({
  name: 'waitingMsg',
  initialState,
  reducers: {
    setWaitingMsg: (state) => {
      state.isWaitingMsg = true;
      sessionStorage.setItem('isWaitingMsg', 'true');
    },
    setNotWaitingMsg: (state) => {
      state.isWaitingMsg = false;
      sessionStorage.setItem('isWaitingMsg', 'false');
    },
    setOpenWaitingAnimation: (state) => {
      state.openWaitingAnimation = true;
    },
    setCloseWaitingAnimation: (state) => {
      state.openWaitingAnimation = false;
    },
    setIsSending: (state, { payload }) => {
      state.isSending = payload;
    }
  }
});

export default waitingMsgSlice.reducer;
export const { setWaitingMsg, setNotWaitingMsg, setOpenWaitingAnimation, setCloseWaitingAnimation, setIsSending } = waitingMsgSlice.actions;