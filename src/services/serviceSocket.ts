/* import { dispatch } from "@/slices";
import { addMessage } from "@/slices/messagesSlice";
import type { Message } from "@/slices/types/types";


function setupSocketListener() {
  socket.on('newMessage', (payload: Message) => {
    dispatch(addMessage(payload));
  });

  return socket.off('newMessage');
}

export default function initSocket() {
  return setupSocketListener();
} */