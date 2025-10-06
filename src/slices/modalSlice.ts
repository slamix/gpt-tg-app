import { createSlice } from "@reduxjs/toolkit";
import { Chat } from "@/slices/types/types";

interface ModalState {
  renameModalIsOpen: boolean;
  removeModalIsOpen: boolean;
  currentChat: Chat | null;
  onCloseSidebar?: () => void;
}

const initialState: ModalState = {
  renameModalIsOpen: false,
  removeModalIsOpen: false,
  currentChat: null,
  onCloseSidebar: undefined,
}


const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    setOpen: (state, { payload }) => {
      const { method, chat, onCloseSidebar } = payload;
      state.currentChat = chat;
      state.onCloseSidebar = onCloseSidebar;
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
      // Очищаем функцию при закрытии
      state.onCloseSidebar = undefined;
    }
  }
});

export default modalSlice.reducer;
export const { setOpen, setClose } = modalSlice.actions;