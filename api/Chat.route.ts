import express from "express";
import authMiddleware from "../utils/authMiddleware";
import validateBodyMiddleware from "../utils/validateBodyMiddleware";
import ChatController from "./controllers/Chat.controller";
import { simpleRateLimit } from "./limiter/limiters";
import * as Yup from "yup";
import slowDown from "express-slow-down";

const router = express.Router().use(authMiddleware);

router.route("/search/user/:name").post(
  simpleRateLimit({
    routeName: "searchUser",
    maxReqs: 10,
    windowMs: 5000,
    msg: "You have to wait BLOCKDURATION before you can search again",
    blockDuration: 2000,
  }),
  slowDown({
    windowMs: 2000,
    delayAfter: 10,
    delayMs: 1000,
  }),
  ChatController.searchUser
);

//Conversation (private messaging)
router.route("/conversations").get(ChatController.getConversations);
router.route("/conversation/:uid").get(ChatController.getConversation);
router.route("/conversation/:uid").delete(ChatController.deleteConversation);
router.route("/conversation/message").post(
  simpleRateLimit({
    routeName: "privateMessage",
    maxReqs: 5,
    windowMs: 10000,
    msg: "You have sent too many messages. Max 5 every 10 seconds. You must wait BLOCKDURATION before you can send another message.",
    blockDuration: 20000,
  }),
  validateBodyMiddleware({
    message: Yup.string().required(),
    hasAttachment: Yup.boolean().nullable().notRequired(),
    recipientId: Yup.string().required(),
  }),
  ChatController.sendPrivateMessage
);
router
  .route("/conversation/message")
  .delete(ChatController.deletePrivateMessage);
router.route("/conversation/message").put(
  simpleRateLimit({
    routeName: "editPrivateMessage",
    maxReqs: 3,
    windowMs: 10000,
    msg: "You have been editing messages too fast. You can edit no more than 3 messages every 10 seconds. You must wait BLOCKDURATION.",
    blockDuration: 20000,
  }),
  validateBodyMiddleware({
    messageId: Yup.string().required(),
    message: Yup.string().required(),
  }),
  ChatController.updatePrivateMessage
);
router.route("/conversation/roomInvite").post(
  simpleRateLimit({
    routeName: "privateMessage",
    maxReqs: 5,
    windowMs: 10000,
    msg: "You have sent too many messages. Max 5 every 10 seconds. You must wait BLOCKDURATION before you can send another message.",
    blockDuration: 20000,
  }),
  validateBodyMiddleware({
    recipientId: Yup.string().required(),
    roomName: Yup.string().required(),
  }),
  ChatController.sendInvite
);
router.route("/conversation/roomInvite/accept").post(
  simpleRateLimit({
    routeName: "privateMessage",
    maxReqs: 5,
    windowMs: 10000,
    msg: "You have sent too many messages. Max 5 every 10 seconds. You must wait BLOCKDURATION before you can send another message.",
    blockDuration: 20000,
  }),
  validateBodyMiddleware({
    senderId: Yup.string().required(),
    roomName: Yup.string().required(),
  }),
  ChatController.acceptInvite
);
router.route("/conversation/roomInvite/decline").post(
  simpleRateLimit({
    routeName: "privateMessage",
    maxReqs: 5,
    windowMs: 10000,
    msg: "You have sent too many messages. Max 5 every 10 seconds. You must wait BLOCKDURATION before you can send another message.",
    blockDuration: 20000,
  }),
  validateBodyMiddleware({
    senderId: Yup.string().required(),
    roomName: Yup.string().required(),
  }),
  ChatController.declineInvite
);
router.route("/conversation/message/attachment/:msgId/:bytes").post(
  simpleRateLimit({
    routeName: "sendPrivateAttachment",
    maxReqs: 10,
    windowMs: 120000,
    msg: "You have been uploading too many attachments. Maximum 10 attachments every 2 minutes. You must wait BLOCKDURATION.",
    blockDuration: 120000,
  }),
  ChatController.uploadPrivateMessageAttachment
);
router
  .route("/conversation/videoCall/:uid")
  .post(ChatController.conversationOpenVideoChat);

//Chatroom messages
router.route("/room/message").post(
  simpleRateLimit({
    routeName: "roomMessage",
    maxReqs: 5,
    windowMs: 10000,
    msg: "You have sent too many messages. Max 5 every 10 seconds. You must wait BLOCKDURATION before you can send another message.",
    blockDuration: 20000,
  }),
  validateBodyMiddleware({
    message: Yup.string().required(),
    hasAttachment: Yup.boolean().nullable().notRequired(),
    roomId: Yup.string().required(),
  }),
  ChatController.sendRoomMessage
);
router.route("/room/message").delete(ChatController.deleteRoomMessage);
router.route("/room/message").put(
  simpleRateLimit({
    routeName: "editRoomMessage",
    maxReqs: 3,
    windowMs: 10000,
    msg: "You have been editing messages too fast. You can edit no more than 3 messages every 10 seconds. You must wait BLOCKDURATION.",
    blockDuration: 20000,
  }),
  validateBodyMiddleware({
    message: Yup.string().required(),
    messageId: Yup.string().required(),
  }),
  ChatController.updateRoomMessage
);
router.route("/room/message/attachment/:msgId/:bytes").post(
  simpleRateLimit({
    routeName: "sendPrivateAttachment",
    maxReqs: 10,
    windowMs: 120000,
    msg: "You have been uploading too many attachments. Maximum 10 attachments every 2 minutes. You must wait BLOCKDURATION.",
    blockDuration: 120000,
  }),
  ChatController.uploadRoomMessageAttachment
);
//Chatrooms
router.route("/room").get(ChatController.getRooms);
router.route("/room").post(
  validateBodyMiddleware({
    name: Yup.string().required(),
  }),
  ChatController.createRoom
);
router.route("/room/:roomId").get(ChatController.getRoom);
router.route("/room/:roomId/users").get(ChatController.getRoomUsers);
router.route("/room/:roomId/messages").get(ChatController.getRoomMessages);
router.route("/room/:roomId").delete(ChatController.deleteRoom);
router.route("/room/:roomId").patch(
  validateBodyMiddleware({
    name: Yup.string().notRequired(),
    public: Yup.boolean().nullable().notRequired()
  }),
  ChatController.updateRoom
);
router.route("/room/:roomId/video/join").post(ChatController.roomOpenVideoChat);
//Chatroom User actions (join/leave/kick/ban)
router.route("/room/:roomId/join").post(ChatController.joinRoom);
router.route("/room/:roomId/leave").post(ChatController.leaveRoom);
router.route("/room/:roomId/kick/:kickUid").post(ChatController.kickUser);
router.route("/room/:roomId/ban/:banUid").post(ChatController.banUser);
router.route("/room/:roomId/unban/:unbanUid").post(ChatController.unbanUser);

export default router;
