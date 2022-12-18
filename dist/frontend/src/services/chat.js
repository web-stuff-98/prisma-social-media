"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationOpenVideoChat = exports.acceptInvite = exports.declineInvite = exports.sendInvite = exports.updateRoom = exports.getRoomUsers = exports.roomOpenVideoChat = exports.createRoom = exports.unbanUserFromRoom = exports.banUserFromRoom = exports.kickUserFromRoom = exports.leaveRoom = exports.joinRoom = exports.getRoomMessages = exports.getRoom = exports.getRooms = exports.searchUsers = exports.deleteRoomMessage = exports.updateRoomMessage = exports.sendRoomMessage = exports.updatePrivateMessage = exports.deletePrivateMessage = exports.sendPrivateMessage = exports.uploadRoomMessageAttachment = exports.uploadPrivateMessageAttachment = exports.deleteConversation = exports.getConversation = exports.getConversations = void 0;
const makeRequest_1 = require("./makeRequest");
const getConversations = () => (0, makeRequest_1.makeRequest)("/api/chat/conversations", { withCredentials: true });
exports.getConversations = getConversations;
const getConversation = (uid) => (0, makeRequest_1.makeRequest)(`/api/chat/conversation/${uid}`, { withCredentials: true });
exports.getConversation = getConversation;
const deleteConversation = (uid) => (0, makeRequest_1.makeRequest)(`/api/chat/conversation/${uid}`, {
    withCredentials: true,
    method: "DELETE",
});
exports.deleteConversation = deleteConversation;
const sendInvite = (roomName, recipientId) => (0, makeRequest_1.makeRequest)(`/api/chat/conversation/roomInvite`, {
    method: "POST",
    withCredentials: true,
    data: {
        roomName,
        recipientId,
    },
});
exports.sendInvite = sendInvite;
const acceptInvite = (senderId, roomName) => (0, makeRequest_1.makeRequest)(`/api/chat/conversation/roomInvite/accept`, {
    method: "POST",
    withCredentials: true,
    data: {
        senderId,
        roomName,
    },
});
exports.acceptInvite = acceptInvite;
const declineInvite = (senderId, roomName) => (0, makeRequest_1.makeRequest)(`/api/chat/conversation/roomInvite/decline`, {
    method: "POST",
    withCredentials: true,
    data: {
        senderId,
        roomName,
    },
});
exports.declineInvite = declineInvite;
const createRoom = (name) => (0, makeRequest_1.makeRequest)("/api/chat/room", {
    withCredentials: true,
    method: "POST",
    data: { name },
});
exports.createRoom = createRoom;
const joinRoom = (roomId) => (0, makeRequest_1.makeRequest)(`/api/chat/room/${roomId}/join`, {
    withCredentials: true,
    method: "POST",
});
exports.joinRoom = joinRoom;
const leaveRoom = (roomId) => (0, makeRequest_1.makeRequest)(`/api/chat/room/${roomId}/leave`, {
    withCredentials: true,
    method: "POST",
});
exports.leaveRoom = leaveRoom;
const kickUserFromRoom = (roomId, uid) => (0, makeRequest_1.makeRequest)(`/api/chat/room/${roomId}/kick/${uid}`, {
    withCredentials: true,
    method: "POST",
});
exports.kickUserFromRoom = kickUserFromRoom;
const banUserFromRoom = (roomId, uid) => (0, makeRequest_1.makeRequest)(`/api/chat/room/${roomId}/ban/${uid}`, {
    withCredentials: true,
    method: "POST",
});
exports.banUserFromRoom = banUserFromRoom;
const unbanUserFromRoom = (roomId, uid) => (0, makeRequest_1.makeRequest)(`/api/chat/room/${roomId}/unban/${uid}`, {
    withCredentials: true,
    method: "POST",
});
exports.unbanUserFromRoom = unbanUserFromRoom;
const roomOpenVideoChat = (roomId) => (0, makeRequest_1.makeRequest)(`/api/chat/room/${roomId}/video/join`, {
    withCredentials: true,
    method: "POST",
});
exports.roomOpenVideoChat = roomOpenVideoChat;
const sendRoomMessage = (message, roomId, hasAttachment) => (0, makeRequest_1.makeRequest)(`/api/chat/room/message`, {
    method: "POST",
    withCredentials: true,
    data: {
        message,
        hasAttachment,
        roomId,
    },
});
exports.sendRoomMessage = sendRoomMessage;
const deleteRoomMessage = (messageId) => (0, makeRequest_1.makeRequest)(`/api/chat/room/message`, {
    method: "DELETE",
    withCredentials: true,
    data: {
        messageId,
    },
});
exports.deleteRoomMessage = deleteRoomMessage;
const updateRoomMessage = (messageId, message) => (0, makeRequest_1.makeRequest)(`/api/chat/room/message`, {
    method: "PUT",
    withCredentials: true,
    data: {
        messageId,
        message,
    },
});
exports.updateRoomMessage = updateRoomMessage;
const uploadRoomMessageAttachment = (msgId, bytes, file) => __awaiter(void 0, void 0, void 0, function* () {
    var data = new FormData();
    if (!file)
        throw new Error("No file!");
    data.append("file", file);
    (0, makeRequest_1.makeRequest)(`/api/chat/room/message/attachment/${msgId}/${bytes}`, {
        withCredentials: true,
        method: "POST",
        data,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
});
exports.uploadRoomMessageAttachment = uploadRoomMessageAttachment;
const getRoomUsers = (roomId) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, makeRequest_1.makeRequest)(`/api/chat/room/${roomId}/users`, {
        withCredentials: true,
    });
});
exports.getRoomUsers = getRoomUsers;
const updateRoom = (roomId, data) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, makeRequest_1.makeRequest)(`/api/chat/room/${roomId}`, {
        method: "PATCH",
        withCredentials: true,
        data,
    });
});
exports.updateRoom = updateRoom;
const sendPrivateMessage = (message, recipientId, hasAttachment) => (0, makeRequest_1.makeRequest)(`/api/chat/conversation/message`, {
    method: "POST",
    withCredentials: true,
    data: {
        message,
        hasAttachment,
        recipientId,
    },
});
exports.sendPrivateMessage = sendPrivateMessage;
const deletePrivateMessage = (messageId) => (0, makeRequest_1.makeRequest)(`/api/chat/conversation/message`, {
    method: "DELETE",
    withCredentials: true,
    data: {
        messageId,
    },
});
exports.deletePrivateMessage = deletePrivateMessage;
const updatePrivateMessage = (messageId, message) => (0, makeRequest_1.makeRequest)(`/api/chat/conversation/message`, {
    method: "PUT",
    withCredentials: true,
    data: {
        message,
        messageId,
    },
});
exports.updatePrivateMessage = updatePrivateMessage;
const uploadPrivateMessageAttachment = (msgId, bytes, file) => __awaiter(void 0, void 0, void 0, function* () {
    var data = new FormData();
    if (!file)
        throw new Error("No file!");
    data.append("file", file);
    (0, makeRequest_1.makeRequest)(`/api/chat/conversation/message/attachment/${msgId}/${bytes}`, {
        withCredentials: true,
        method: "POST",
        data,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
});
exports.uploadPrivateMessageAttachment = uploadPrivateMessageAttachment;
const searchUsers = (name) => (0, makeRequest_1.makeRequest)(`/api/chat/search/user/${name}`, {
    withCredentials: true,
    method: "POST",
});
exports.searchUsers = searchUsers;
const getRooms = () => (0, makeRequest_1.makeRequest)(`/api/chat/room`, { withCredentials: true });
exports.getRooms = getRooms;
const getRoom = (roomId) => (0, makeRequest_1.makeRequest)(`/api/chat/room/${roomId}`, { withCredentials: true });
exports.getRoom = getRoom;
const getRoomMessages = (roomId) => (0, makeRequest_1.makeRequest)(`/api/chat/room/${roomId}/messages`, { withCredentials: true });
exports.getRoomMessages = getRoomMessages;
const conversationOpenVideoChat = (uid) => (0, makeRequest_1.makeRequest)(`/api/chat/conversation/videoCall/${uid}`, {
    method: "POST",
    withCredentials: true,
});
exports.conversationOpenVideoChat = conversationOpenVideoChat;
