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
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static sendPrivateMessage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.sendPrivateMessage(req.body.message, req.body.hasAttachment, req.body.recipientId, req.user.id);
                res.status(201).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static updatePrivateMessage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.updatePrivateMessage(req.body.messageId, req.body.message, req.user.id);
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static deletePrivateMessage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.deletePrivateMessage(req.body.messageId, req.user.id);
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static sendInvite(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.inviteUser(req.body.recipientId, req.user.id, req.body.roomName);
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static acceptInvite(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.acceptInvite(req.user.id, req.body.senderId, req.body.roomName),
                    res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static declineInvite(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.declineInvite(req.user.id, req.body.senderId, req.body.roomName),
                    res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static getConversations(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield Chat_dao_1.default.getConversations(req.user.id);
                res.status(200).json(users).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static getConversation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const messages = yield Chat_dao_1.default.getConversation(req.params.uid, req.user.id);
                res.status(200).json(messages).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static deleteConversation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.deleteConversation(req.user.id, req.params.uid);
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    // messy crap ahead
    static uploadPrivateMessageAttachment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            /* This is messy and breaks the design pattern because busboy.on("file") wouldn't fire from
            inside the Chat DAO for some reason. I wrote the same code in my other project and it
            worked on the first try (webrtc-chat-js). I gave up after trying for 3 + 2 + 3 days and I don't care
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
            bb.on("file", (_, stream, info) => __awaiter(this, void 0, void 0, function* () {
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
                    res.status(400).json({ msg: `${e}` });
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
    static conversationOpenVideoChat(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.conversationOpenVideoChat(req.user.id, req.params.uid);
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
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
                const room = yield Chat_dao_1.default.getRoomById(req.params.roomId);
                res.status(200).json(room).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static getRoomMessages(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const messages = yield Chat_dao_1.default.getRoomMessages(req.params.roomId);
                res.status(200).json(messages).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static createRoom(req, res) {
        var _a;
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
                const room = yield Chat_dao_1.default.createRoom(name, req.user.id);
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
                yield Chat_dao_1.default.updateRoom(req.params.roomId, req.body);
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static deleteRoom(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.deleteRoom(req.params.roomId, req.user.id);
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static joinRoom(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.joinRoom(req.params.roomId, req.user.id);
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static leaveRoom(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.leaveRoom(req.params.roomId, req.user.id);
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static banUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.banUser(req.params.roomId, req.params.banUid, req.user.id);
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static unbanUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.unbanUser(req.params.roomId, req.params.unbanUid, req.user.id);
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static kickUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.kickUser(req.params.roomId, req.params.kickUid, req.user.id);
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static sendRoomMessage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.sendRoomMessage(req.body.message, req.body.hasAttachment, req.user.id, req.body.roomId);
                res.status(201).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static updateRoomMessage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.updateRoomMessage(req.body.messageId, req.body.message, req.user.id);
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static deleteRoomMessage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.deleteRoomMessage(req.body.messageId, req.user.id);
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static getRoomUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const uids = yield Chat_dao_1.default.getRoomUsers(req.params.roomId);
                res.status(200).json(uids);
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
            worked on the first try (webrtc-chat-js). I gave up after trying for 3 + 2 + 3 days and I don't care
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
                    res.status(400).json({ msg: `${e}` });
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
    static roomOpenVideoChat(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Chat_dao_1.default.roomOpenVideoChat(req.user.id, req.params.roomId);
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
}
exports.default = ChatController;
