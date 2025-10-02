import { createSlice } from "@reduxjs/toolkit";
import { Chat } from "@/slices/types/types";

interface ModalState {
  renameModalIsOpen: boolean;
  removeModalIsOpen: boolean;
  currentChat: Chat | null
}

const initialState: ModalState = {
  renameModalIsOpen: false,
  removeModalIsOpen: false,
  currentChat: null,
}


const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    setOpen: (state, { payload }) => {
      const { method, chat } = payload;
      state.currentChat = chat;
      if (method === 'rename') {
        state.renameModalIsOpen = true;
      } else if (method === 'remove') {
        state.removeModalIsOpen = true;
      }
    },
    setClose: (state, { payload }) => {
      if (payload === 'rename') {
        state.renameModalIsOpen = false;
      } else if (payload === 'remove') {
        state.removeModalIsOpen = false;
      }
    }
  }
});

export default modalSlice.reducer;
export const { setOpen, setClose } = modalSlice.actions;