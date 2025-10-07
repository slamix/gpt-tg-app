import { configureStore } from "@reduxjs/toolkit";
import activeChatReducer from "@/slices/activeChatSlice";
import messagesReducer from "@/slices/messagesSlice";
import authReducer from "@/slices/authSlice";
import modalReducer from "@/slices/modalSlice";
import waitingMsgReducer from "@/slices/waitingMsgSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    activeChat: activeChatReducer,
    messages: messagesReducer,
    modals: modalReducer,
    waitingMsg: waitingMsgReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Игнорируем несериализуемые значения в определенных путях
        ignoredActions: ['activeChat/setActiveChat'],
        ignoredActionsPaths: ['payload.timestamp'],
        ignoredPaths: ['activeChat.activeChat.timestamp'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;
export const { dispatch, getState } = store;

export default store;