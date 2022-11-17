import { makeRequest } from "./makeRequest";

const getConversations = () =>
  makeRequest("/api/chat/conversations", { withCredentials: true });
const getConversation = (uid: string) =>
  makeRequest(`/api/chat/conversation/${uid}`, { withCredentials: true });
const deleteConversation = (uid: string) =>
  makeRequest(`/api/chat/conversation/${uid}`, {
    withCredentials: true,
    method: "DELETE",
  });

const sendRoomMessage = (
  message: string,
  roomId: string,
  hasAttachment: boolean
) =>
  makeRequest(`/api/chat/room/message`, {
    method: "POST",
    withCredentials: true,
    data: {
      message,
      hasAttachment,
      roomId,
    },
  });
const deleteRoomMessage = (messageId: string) =>
  makeRequest(`/api/chat/room/message`, {
    method: "DELETE",
    withCredentials: true,
    data: {
      messageId,
    },
  });
const updateRoomMessage = (messageId: string, message: string) =>
  makeRequest(`/api/chat/room/message`, {
    method: "PUT",
    withCredentials: true,
    data: {
      messageId,
      message,
    },
  });
const uploadRoomMessageAttachment = (
  msgId: string,
  bytes: number,
  file: File
) => {
  var data = new FormData();
  if (!file) throw new Error("No file!");
  data.append("file", file);
  makeRequest(`/api/chat/room/message/attachment/${msgId}/${bytes}`, {
    withCredentials: true,
    method: "POST",
    data,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

const sendPrivateMessage = (
  message: string,
  recipientId: string,
  hasAttachment: boolean
) =>
  makeRequest(`/api/chat/conversation/message`, {
    method: "POST",
    withCredentials: true,
    data: {
      message,
      hasAttachment,
      recipientId,
    },
  });
const deletePrivateMessage = (messageId: string) =>
  makeRequest(`/api/chat/conversation/message`, {
    method: "DELETE",
    withCredentials: true,
    data: {
      messageId,
    },
  });
const updatePrivateMessage = (messageId: string, message: string) =>
  makeRequest(`/api/chat/conversation/message`, {
    method: "PUT",
    withCredentials: true,
    data: {
      messageId,
      message,
    },
  });
const uploadPrivateMessageAttachment = (
  msgId: string,
  bytes: number,
  file: File
) => {
  var data = new FormData();
  if (!file) throw new Error("No file!");
  data.append("file", file);
  makeRequest(`/api/chat/conversation/message/attachment/${msgId}/${bytes}`, {
    withCredentials: true,
    method: "POST",
    data,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
const searchUsers = (name: string) =>
  makeRequest(`/api/chat/search/user/${name}`, {
    withCredentials: true,
    method: "POST",
  });
const getRooms = () => makeRequest(`/api/chat/room`, { withCredentials: true });

export {
  getConversations,
  getConversation,
  deleteConversation,
  uploadPrivateMessageAttachment,
  uploadRoomMessageAttachment,
  sendPrivateMessage,
  deletePrivateMessage,
  updatePrivateMessage,
  sendRoomMessage,
  updateRoomMessage,
  deleteRoomMessage,
  searchUsers,
  getRooms,
};
