import { createSlice } from "@reduxjs/toolkit";

interface WaitingMsgState {
  isWaitingMsg: boolean;
  openWaitingAnimation: boolean;
}

const initialState: WaitingMsgState = {
  isWaitingMsg: sessionStorage.getItem('isWaitingMsg') === 'true' ? true : false,
  openWaitingAnimation: sessionStorage.getItem('openWaitingAnimation') === 'true' ? true : false,
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
      sessionStorage.setItem('openWaitingAnimation', 'true');
    },
    setCloseWaitingAnimation: (state) => {
      state.openWaitingAnimation = false;
      sessionStorage.setItem('openWaitingAnimation', 'false');
    }
  }
});

export default waitingMsgSlice.reducer;
export const { setWaitingMsg, setNotWaitingMsg, setOpenWaitingAnimation, setCloseWaitingAnimation } = waitingMsgSlice.actions;