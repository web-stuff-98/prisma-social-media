import express from "express";
import authMiddleware from "../utils/authMiddleware";
import MessengerController from "./controllers/Messenger.controller";
const router = express.Router();

router
  .route("/conversations")
  .get(authMiddleware, MessengerController.getConversations);
router
  .route("/conversation/:uid")
  .get(authMiddleware, MessengerController.getConversation);
router
  .route("/conversation/:uid")
  .delete(authMiddleware, MessengerController.deleteConversation);
router
  .route("/attachment/:msgId/:bytes")
  .post(authMiddleware, MessengerController.uploadAttachment);

export default router;
