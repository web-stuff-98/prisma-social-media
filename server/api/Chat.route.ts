import express from "express";
import authMiddleware from "../utils/authMiddleware";
import ChatController from "./controllers/Chat.controller";

const router = express.Router().use(authMiddleware);

router.route("/search/user/:name").post(ChatController.searchUser);

//Conversation (private messaging)
router.route("/conversations").get(ChatController.getConversations);
router.route("/conversation/:uid").get(ChatController.getConversation);
router.route("/conversation/:uid").delete(ChatController.deleteConversation);
router.route("/conversation/message").post(ChatController.sendPrivateMessage);
router
  .route("/conversation/message")
  .delete(ChatController.deletePrivateMessage);
router.route("/conversation/message").put(ChatController.updatePrivateMessage);
router
  .route("/conversation/message/attachment/:msgId/:bytes")
  .post(ChatController.uploadPrivateMessageAttachment);

//Chatroom messages
router.route("/room/message").post(ChatController.sendRoomMessage);
router.route("/room/message").delete(ChatController.deleteRoomMessage);
router.route("/room/message").put(ChatController.updateRoomMessage);
router
  .route("/room/message/attachment/:msgId/:bytes")
  .post(ChatController.uploadRoomMessageAttachment);
//Chatrooms
router.route("/room").get(ChatController.getRooms);
router.route("/room").post(ChatController.createRoom);
router.route("/room/:roomId").get(ChatController.getRoom);
router.route("/room/:roomId/messages").get(ChatController.getRoomMessages);
router.route("/room/:roomId").delete(ChatController.deleteRoom);
router.route("/room/:roomId").patch(ChatController.updateRoom);
//Chatroom User actions (join/leave/kick/ban)
router.route("/room/:roomId/join").post(ChatController.joinRoom);
router.route("/room/:roomId/leave").post(ChatController.leaveRoom);
router.route("/room/:roomId/kick/:kickUid").post(ChatController.kickUser);
router.route("/room/:roomId/ban/:banUid").post(ChatController.banUser);

export default router;
