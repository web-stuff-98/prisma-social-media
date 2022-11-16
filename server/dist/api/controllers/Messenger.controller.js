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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const busboy_1 = __importDefault(require("busboy"));
const Messenger_dao_1 = __importDefault(require("../dao/Messenger.dao"));
class MessengerController {
    static getConversations(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield Messenger_dao_1.default.getConversations(String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                res.status(200).json(users).end();
            }
            catch (e) {
                res.status(500).json({ msg: `${e}` });
            }
        });
    }
    static getConversation(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const messages = yield Messenger_dao_1.default.getConversation(req.params.uid, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                res.status(200).json(messages).end();
            }
            catch (e) {
                res.status(500).json({ msg: `${e}` });
            }
        });
    }
    static deleteConversation(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Messenger_dao_1.default.deleteConversation(String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id), req.params.uid);
                res.status(200).end();
            }
            catch (e) {
                res.status(500).json({ msg: `${e}` });
            }
        });
    }
    static uploadAttachment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            /* This is messy and breaks the design pattern because busboy.on("file") wouldn't fire from
            inside the Messenger DAO for some reason. It doesn't make any sense because it worked in my
            other project (webrtc-chat-js). I gave up after wasting my time trying for 3 days.
            It will have to remain messy, which doesn't actually matter because it works fine. */
            let message;
            try {
                message = yield Messenger_dao_1.default.getMessage(req.params.msgId);
            }
            catch (error) {
                res
                    .status(400)
                    .json({ msg: "Could not find message to upload attachment for" });
            }
            const bb = (0, busboy_1.default)({
                headers: req.headers,
                limits: { files: 1, fields: 0, fileSize: 500000000 },
            });
            req.pipe(bb);
            let gotFile = false;
            let successData = { key: "", type: "", recipientId: "" };
            bb.on("file", (name, stream, info) => __awaiter(this, void 0, void 0, function* () {
                gotFile = true;
                try {
                    successData = yield Messenger_dao_1.default.uploadAttachment(stream, info, message, Number(req.params.bytes));
                }
                catch (e) {
                    req.unpipe(bb);
                    yield Messenger_dao_1.default.attachmentError(message.senderId, message.recipientId, message.id);
                    res.status(400).json({ msg: `${e}` });
                }
            }));
            bb.on("finish", () => __awaiter(this, void 0, void 0, function* () {
                if (!gotFile) {
                    yield Messenger_dao_1.default.attachmentError(message.senderId, message.recipientId, message.id);
                    res.status(400).json({ msg: "No file sent" });
                }
                else {
                    yield Messenger_dao_1.default.attachmentComplete(message.senderId, successData.recipientId, req.params.msgId, successData.type, successData.key);
                    res.writeHead(201, { Connection: "close" });
                    res.end();
                }
            }));
            bb.on("error", (e) => __awaiter(this, void 0, void 0, function* () {
                console.warn(`${e}`);
                yield Messenger_dao_1.default.attachmentError(message.senderId, message.recipientId, message.id);
                req.unpipe(bb);
                res.status(500).json({ msg: "Internal error" });
            }));
        });
    }
}
exports.default = MessengerController;
