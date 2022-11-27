"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = __importDefault(require("../utils/authMiddleware"));
const Chat_controller_1 = __importDefault(require("./controllers/Chat.controller"));
const limiters_1 = require("./limiter/limiters");
const router = express_1.default.Router().use(authMiddleware_1.default);
router.route("/search/user/:name").post(Chat_controller_1.default.searchUser);
//Conversation (private messaging)
router.route("/conversations").get(Chat_controller_1.default.getConversations);
router.route("/conversation/:uid").get(Chat_controller_1.default.getConversation);
router.route("/conversation/:uid").delete(Chat_controller_1.default.deleteConversation);
router.route("/conversation/message").post((0, limiters_1.simpleRateLimit)({
    routeName: "privateMessage",
    maxReqs: 5,
    windowMs: 10000,
    msg: "You have sent too many messages. Max 5 every 10 seconds. You must wait BLOCKDURATION before you can send another message.",
    blockDuration: 20000,
}), Chat_controller_1.default.sendPrivateMessage);
router
    .route("/conversation/message")
    .delete(Chat_controller_1.default.deletePrivateMessage);
router.route("/conversation/message").put((0, limiters_1.simpleRateLimit)({
    routeName: "editPrivateMessage",
    maxReqs: 3,
    windowMs: 10000,
    msg: "You have been editing messages too fast. You can edit no more than 3 messages every 10 seconds. You must wait BLOCKDURATION.",
    blockDuration: 20000,
}), Chat_controller_1.default.updatePrivateMessage);
router.route("/conversation/message/attachment/:msgId/:bytes").post((0, limiters_1.simpleRateLimit)({
    routeName: "sendPrivateAttachment",
    maxReqs: 10,
    windowMs: 120000,
    msg: "You have been uploading too many attachments. Maximum 10 attachments every 2 minutes. You must wait BLOCKDURATION.",
    blockDuration: 120000,
}), Chat_controller_1.default.uploadPrivateMessageAttachment);
//Chatroom messages
router.route("/room/message").post((0, limiters_1.simpleRateLimit)({
    routeName: "roomMessage",
    maxReqs: 5,
    windowMs: 10000,
    msg: "You have sent too many messages. Max 5 every 10 seconds. You must wait BLOCKDURATION before you can send another message.",
    blockDuration: 20000,
}), Chat_controller_1.default.sendRoomMessage);
router.route("/room/message").delete(Chat_controller_1.default.deleteRoomMessage);
router.route("/room/message").put((0, limiters_1.simpleRateLimit)({
    routeName: "editRoomMessage",
    maxReqs: 3,
    windowMs: 10000,
    msg: "You have been editing messages too fast. You can edit no more than 3 messages every 10 seconds. You must wait BLOCKDURATION.",
    blockDuration: 20000,
}), Chat_controller_1.default.updateRoomMessage);
router.route("/room/message/attachment/:msgId/:bytes").post((0, limiters_1.simpleRateLimit)({
    routeName: "sendPrivateAttachment",
    maxReqs: 10,
    windowMs: 120000,
    msg: "You have been uploading too many attachments. Maximum 10 attachments every 2 minutes. You must wait BLOCKDURATION.",
    blockDuration: 120000,
}), Chat_controller_1.default.uploadRoomMessageAttachment);
//Chatrooms
router.route("/room").get(Chat_controller_1.default.getRooms);
router.route("/room").post(Chat_controller_1.default.createRoom);
router.route("/room/:roomId").get(Chat_controller_1.default.getRoom);
router.route("/room/:roomId/users").get(Chat_controller_1.default.getRoomUsers);
router.route("/room/:roomId/messages").get(Chat_controller_1.default.getRoomMessages);
router.route("/room/:roomId").delete(Chat_controller_1.default.deleteRoom);
router.route("/room/:roomId").patch(Chat_controller_1.default.updateRoom);
router.route("/room/:roomId/video/join").post(Chat_controller_1.default.roomOpenVideoChat);
//Chatroom User actions (join/leave/kick/ban)
router.route("/room/:roomId/join").post(Chat_controller_1.default.joinRoom);
router.route("/room/:roomId/leave").post(Chat_controller_1.default.leaveRoom);
router.route("/room/:roomId/kick/:kickUid").post(Chat_controller_1.default.kickUser);
router.route("/room/:roomId/ban/:banUid").post(Chat_controller_1.default.banUser);
router.route("/room/:roomId/unban/:unbanUid").post(Chat_controller_1.default.unbanUser);
exports.default = router;
