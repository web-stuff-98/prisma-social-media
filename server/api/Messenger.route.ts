import express from "express";
import authMiddleware from "../utils/authMiddleware";
import MessengerController from "./controllers/Messenger.controller";
const router = express.Router();

router
  .route("/:msgId/:bytes")
  .post(authMiddleware, MessengerController.uploadAttachment);

export default router;
