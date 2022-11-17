import express from "express";
import authMiddleware from "../utils/authMiddleware";
import ChatController from "./controllers/Chat.controller";
const router = express.Router().use(authMiddleware);

router.route("/conversations").get(ChatController.getConversations);
router.route("/conversation/:uid").get(ChatController.getConversation);
router.route("/conversation/:uid").delete(ChatController.deleteConversation);
router
  .route("/conversation/message")
  .post(ChatController.sendPrivateMessage);
router
  .route("/conversation/message")
  .delete(ChatController.deletePrivateMessage);
router
  .route("/conversation/message")
  .put(ChatController.updatePrivateMessage);
router
  .route("/conversation/message/attachment/:msgId/:bytes")
  .post(ChatController.uploadPrivateMessageAttachment);

router.route("/room").get(ChatController.getRooms);
router.route("/room/:roomId").get(ChatController.getRoom);
router.route("/room/:roomId").delete(ChatController.deleteRoom);
router.route("/room/:roomId").patch(ChatController.updateRoom);
router
  .route("/room/message/attachment/:msgId/:bytes")
  .post(ChatController.uploadRoomMessageAttachment);
router.route("/search/user/:name").post(ChatController.searchUser);

export default router;
