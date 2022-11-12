"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = __importDefault(require("../utils/authMiddleware"));
const Messenger_controller_1 = __importDefault(require("./controllers/Messenger.controller"));
const router = express_1.default.Router();
router
    .route("/:msgId/:bytes")
    .post(authMiddleware_1.default, Messenger_controller_1.default.uploadAttachment);
exports.default = router;
