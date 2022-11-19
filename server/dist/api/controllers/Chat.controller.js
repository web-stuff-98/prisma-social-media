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
const Chat_dao_1 = __importDefault(require("../dao/Chat.dao"));
class ChatController {
    static searchUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield Chat_dao_1.default.searchUser(req.params.name);
                res.status(200).json(users);
            }
            catch (e) {
                res.status(500).json({ msg: "Internal error" });
            }
        });
    }
    //Conversations (private messaging)
    static sendPrivateMessage(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.sendPrivateMessage(req.body.message, req.body.hasAttachment, req.body.recipientId, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                res.status(201).end();
            }
            catch (e) {
                res.status(500).json({ msg: "Internal error" });
            }
        });
    }
    static updatePrivateMessage(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.updatePrivateMessage(req.body.messageId, req.body.message, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                res.status(200).end();
            }
            catch (e) {
                res.status(500).json({ msg: "Internal error" });
            }
        });
    }
    static deletePrivateMessage(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("DELETE MESSAGE CONTROLLER");
                yield Chat_dao_1.default.deletePrivateMessage(req.body.messageId, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                res.status(200).end();
            }
            catch (e) {
                res.status(500).json({ msg: "Internal error" });
            }
        });
    }
    static getConversations(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield Chat_dao_1.default.getConversations(String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                res.status(200).json(users).end();
            }
            catch (e) {
                res.status(500).json({ msg: "Internal error" });
            }
        });
    }
    static getConversation(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const messages = yield Chat_dao_1.default.getConversation(req.params.uid, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                res.status(200).json(messages).end();
            }
            catch (e) {
                res.status(500).json({ msg: "Internal error" });
            }
        });
    }
    static deleteConversation(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.deleteConversation(String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id), req.params.uid);
                res.status(200).end();
            }
            catch (e) {
                res.status(500).json({ msg: "Internal error" });
            }
        });
    }
    // messy crap ahead
    static uploadPrivateMessageAttachment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            /* This is messy and breaks the design pattern because busboy.on("file") wouldn't fire from
            inside the Chat DAO for some reason. I wrote the same code in my other project and it
            worked on the first try (webrtc-chat-js). I gave up after trying for 3 days and I don't care
            anymore because it doesn't make sense and I can't fix it */
            let message;
            let gotFile = false;
            try {
                message = yield Chat_dao_1.default.getPrivateMessage(req.params.msgId);
            }
            catch (e) {
                res.status(400).json({ msg: "Could not find message for attachment" });
            }
            const bb = (0, busboy_1.default)({
                headers: req.headers,
                limits: { files: 1, fields: 0, fileSize: 500000000 },
            });
            req.pipe(bb);
            bb.on("file", (name, stream, info) => __awaiter(this, void 0, void 0, function* () {
                let successData = { key: "", type: "" };
                gotFile = true;
                try {
                    successData = yield Chat_dao_1.default.uploadConversationAttachment(stream, info, message, Number(req.params.bytes));
                }
                catch (e) {
                    req.unpipe(bb);
                    yield Chat_dao_1.default.conversationAttachmentError(message.senderId, message.recipientId, message.id)
                        .then(() => res.status(400).json({ msg: `${e}` }))
                        .catch((e) => res
                        .status(500)
                        .json({ msg: `${e}` })
                        .end());
                }
                yield Chat_dao_1.default.conversationAttachmentComplete(message.senderId, message.recipientId, req.params.msgId, successData.type, successData.key)
                    .then(() => {
                    res.writeHead(201, { Connection: "close" });
                    res.end();
                })
                    .catch((e) => {
                    req.unpipe(bb);
                    res.status(500).json({ msg: "Internal error" });
                });
            }));
            bb.on("finish", () => __awaiter(this, void 0, void 0, function* () {
                if (!gotFile) {
                    yield Chat_dao_1.default.conversationAttachmentError(message.senderId, message.recipientId, message.id);
                    res.status(400).json({ msg: "No file!" });
                }
            }));
            bb.on("error", (e) => __awaiter(this, void 0, void 0, function* () {
                yield Chat_dao_1.default.conversationAttachmentError(message.senderId, message.recipientId, message.id)
                    .then(() => {
                    req.unpipe(bb);
                    res.status(400).json({ msg: `${e}` });
                })
                    .catch((e) => {
                    req.unpipe(bb);
                    res
                        .status(500)
                        .json({ msg: `${e}` })
                        .end();
                });
            }));
        });
    }
    // Rooms
    static getRooms(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield Chat_dao_1.default.getRooms();
                res.status(200).json(users).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static getRoom(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const messages = yield Chat_dao_1.default.getRoomById(req.params.roomId);
                res.status(200).json(messages).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static createRoom(req, res) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name } = req.body;
                const foundRoom = yield Chat_dao_1.default.getRoomByName(name);
                if (foundRoom) {
                    if (foundRoom.authorId === ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                        return res
                            .status(400)
                            .json({ msg: "You already have a room by that name" })
                            .end();
                    }
                }
                const room = yield Chat_dao_1.default.createRoom(name, String((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
                res.status(201).json(room);
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static updateRoom(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            //This DAO function is not finished.
            try {
                if (req.body.name) {
                    const foundRoom = yield Chat_dao_1.default.getRoomByName(req.body.name);
                    if ((foundRoom === null || foundRoom === void 0 ? void 0 : foundRoom.authorId) === ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                        return res
                            .status(400)
                            .json({
                            message: "You already have a room by that name. Rename the other room first or choose a different name.",
                        })
                            .end();
                    }
                }
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static deleteRoom(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.deleteRoom(req.params.roomId, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static joinRoom(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.joinRoom(req.params.roomId, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static leaveRoom(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.leaveRoom(req.params.roomId, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static banUser(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.banUser(req.params.roomId, req.params.banUid, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static kickUser(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.kickUser(req.params.roomId, req.params.kickUid, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static uploadRoomMessageAttachment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            /* This is messy and breaks the design pattern because busboy.on("file") wouldn't fire from
            inside the Chat DAO for some reason. I wrote the same code in my other project and it
            worked on the first try (webrtc-chat-js). I gave up after trying for 3 days and I don't care
            anymore because it doesn't make sense and I can't fix it */
            let message;
            let gotFile = false;
            try {
                message = yield Chat_dao_1.default.getRoomMessage(req.params.msgId);
            }
            catch (e) {
                res.status(400).json({ msg: "Could not find message for attachment" });
            }
            const bb = (0, busboy_1.default)({
                headers: req.headers,
                limits: { files: 1, fields: 0, fileSize: 500000000 },
            });
            req.pipe(bb);
            bb.on("file", (name, stream, info) => __awaiter(this, void 0, void 0, function* () {
                let successData = { key: "", type: "" };
                gotFile = true;
                try {
                    successData = yield Chat_dao_1.default.uploadRoomAttachment(stream, info, message, Number(req.params.bytes));
                }
                catch (e) {
                    req.unpipe(bb);
                    yield Chat_dao_1.default.roomAttachmentError(message.roomId, message.id)
                        .then(() => res.status(400).json({ msg: `${e}` }))
                        .catch((e) => res
                        .status(500)
                        .json({ msg: `${e}` })
                        .end());
                }
                yield Chat_dao_1.default.roomAttachmentComplete(message.roomId, message.id, successData.type, successData.key)
                    .then(() => {
                    res.writeHead(201, { Connection: "close" });
                    res.end();
                })
                    .catch((e) => {
                    req.unpipe(bb);
                    res.status(500).json({ msg: "Internal error" });
                });
            }));
            bb.on("finish", () => __awaiter(this, void 0, void 0, function* () {
                if (!gotFile) {
                    yield Chat_dao_1.default.roomAttachmentError(message.roomId, message.id);
                    res.status(400).json({ msg: "No file!" });
                }
            }));
            bb.on("error", (e) => __awaiter(this, void 0, void 0, function* () {
                yield Chat_dao_1.default.roomAttachmentError(message.roomId, message.id)
                    .then(() => {
                    req.unpipe(bb);
                    res.status(400).json({ msg: `${e}` });
                })
                    .catch((e) => {
                    req.unpipe(bb);
                    res
                        .status(500)
                        .json({ msg: `${e}` })
                        .end();
                });
            }));
        });
    }
}
exports.default = ChatController;
