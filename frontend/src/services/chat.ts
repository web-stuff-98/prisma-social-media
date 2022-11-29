import { IRoom } from "../context/ChatContext";
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

const createRoom = (name: string) =>
  makeRequest("/api/chat/room", {
    withCredentials: true,
    method: "POST",
    data: { name },
  });
const joinRoom = (roomId: string) =>
  makeRequest(`/api/chat/room/${roomId}/join`, {
    withCredentials: true,
    method: "POST",
  });
const leaveRoom = (roomId: string) =>
  makeRequest(`/api/chat/room/${roomId}/leave`, {
    withCredentials: true,
    method: "POST",
  });
const kickUserFromRoom = (roomId: string, uid: string) =>
  makeRequest(`/api/chat/room/${roomId}/kick/${uid}`, {
    withCredentials: true,
    method: "POST",
  });
const banUserFromRoom = (roomId: string, uid: string) =>
  makeRequest(`/api/chat/room/${roomId}/ban/${uid}`, {
    withCredentials: true,
    method: "POST",
  });
const unbanUserFromRoom = (roomId: string, uid: string) =>
  makeRequest(`/api/chat/room/${roomId}/unban/${uid}`, {
    withCredentials: true,
    method: "POST",
  });

const roomOpenVideoChat = (roomId: string) =>
  makeRequest(`/api/chat/room/${roomId}/video/join`, {
    withCredentials: true,
    method: "POST",
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
const uploadRoomMessageAttachment = async (
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

const getRoomUsers = async (roomId: string) =>
  makeRequest(`/api/chat/room/${roomId}/users`, {
    withCredentials: true,
  });

const updateRoom = async (roomId: string, data: Partial<IRoom>) =>
  makeRequest(`/api/chat/room/${roomId}`, {
    method: "PATCH",
    withCredentials: true,
    data,
  });

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
      message,
      messageId,
    },
  });
const uploadPrivateMessageAttachment = async (
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
const getRoom = (roomId: string) =>
  makeRequest(`/api/chat/room/${roomId}`, { withCredentials: true });
const getRoomMessages = (roomId: string) =>
  makeRequest(`/api/chat/room/${roomId}/messages`, { withCredentials: true });

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
  getRoom,
  getRoomMessages,
  joinRoom,
  leaveRoom,
  kickUserFromRoom,
  banUserFromRoom,
  unbanUserFromRoom,
  createRoom,
  roomOpenVideoChat,
  getRoomUsers,
  updateRoom,
};
