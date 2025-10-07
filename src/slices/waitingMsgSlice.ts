import { createSlice } from "@reduxjs/toolkit";

interface WaitingMsgState {
  isWaitingMsg: boolean;
}

const initialState: WaitingMsgState = {
  isWaitingMsg: sessionStorage.getItem('isWaitingMsg') === 'true' ? true : false,
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
    }
  }
});

export default waitingMsgSlice.reducer;
export const { setWaitingMsg, setNotWaitingMsg } = waitingMsgSlice.actions;