"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = __importDefault(require("../utils/authMiddleware"));
const Chat_controller_1 = __importDefault(require("./controllers/Chat.controller"));
const router = express_1.default.Router().use(authMiddleware_1.default);
router.route("/conversations").get(Chat_controller_1.default.getConversations);
router.route("/conversation/:uid").get(Chat_controller_1.default.getConversation);
router.route("/conversation/:uid").delete(Chat_controller_1.default.deleteConversation);
router
    .route("/conversation/message")
    .post(Chat_controller_1.default.sendPrivateMessage);
router
    .route("/conversation/message")
    .delete(Chat_controller_1.default.deletePrivateMessage);
router
    .route("/conversation/message")
    .put(Chat_controller_1.default.updatePrivateMessage);
router
    .route("/conversation/message/attachment/:msgId/:bytes")
    .post(Chat_controller_1.default.uploadPrivateMessageAttachment);
router.route("/room").get(Chat_controller_1.default.getRooms);
router.route("/room/:roomId").get(Chat_controller_1.default.getRoom);
router.route("/room/:roomId").delete(Chat_controller_1.default.deleteRoom);
router.route("/room/:roomId").patch(Chat_controller_1.default.updateRoom);
router
    .route("/room/message/attachment/:msgId/:bytes")
    .post(Chat_controller_1.default.uploadRoomMessageAttachment);
router.route("/search/user/:name").post(Chat_controller_1.default.searchUser);
exports.default = router;
