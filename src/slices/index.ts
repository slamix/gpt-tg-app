import { configureStore } from "@reduxjs/toolkit";
import activeChatReducer from "@/slices/activeChat";
import chatsReducer from "@/slices/chatsSlice";
import messagesReducer from "@/slices/messagesSlice";

export const store = configureStore({
  reducer: {
    activeChat: activeChatReducer,
    chats: chatsReducer,
    messages: messagesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;

export default store;