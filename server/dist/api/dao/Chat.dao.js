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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../utils/prisma"));
const mime_types_1 = __importDefault(require("mime-types"));
const aws_1 = __importDefault(require("../../utils/aws"));
const __1 = require("../..");
class MessengerDAO {
    static searchUser(name) {
        return __awaiter(this, void 0, void 0, function* () {
            /*
            You could easily make this faster, couldn't be bothered to figure out the proper way of doing it at the time
            It also returns the user making the search, which is maybe shouldn't dos
            */
            const inQ = yield prisma_1.default.user
                .findMany({
                where: {
                    name: {
                        in: name,
                        mode: "insensitive",
                    },
                },
                select: { id: true },
            })
                .then((res) => res.map((u) => u.id));
            const startsWithQ = yield prisma_1.default.user
                .findMany({
                where: {
                    name: {
                        startsWith: name,
                        mode: "insensitive",
                    },
                },
                select: { id: true },
            })
                .then((res) => res.map((u) => u.id));
            const endsWithQ = yield prisma_1.default.user
                .findMany({
                where: {
                    name: {
                        startsWith: name,
                        mode: "insensitive",
                    },
                },
                select: { id: true },
            })
                .then((res) => res.map((u) => u.id));
            const a = inQ.concat(startsWithQ).concat(endsWithQ);
            return a.filter((item, pos) => a.indexOf(item) == pos);
        });
    }
    //Conversations(priate messaging)
    static sendPrivateMessage(message, hasAttachment, recipientId, senderId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (recipientId === senderId) {
                console.log("SEND MESSAGE THROW ERROR");
                throw new Error("You cannot message yourself");
            }
            console.log("SEND MESSAGE");
            const msg = hasAttachment
                ? yield prisma_1.default.privateMessage.create({
                    data: {
                        message,
                        senderId,
                        recipientId,
                        hasAttachment: true,
                        attachmentPending: true,
                    },
                })
                : yield prisma_1.default.privateMessage.create({
                    data: {
                        message,
                        senderId,
                        recipientId,
                        hasAttachment: false,
                        attachmentError: false,
                        attachmentPending: false,
                    },
                });
            __1.io.to(`inbox=${recipientId}`).emit("private_message", msg.id, {
                id: msg.id,
                message: msg.message,
                senderId: msg.senderId,
                recipientId: msg.recipientId,
                hasAttachment: msg.hasAttachment,
                attachmentPending: msg.attachmentPending || null,
                attachmentKey: msg.attachmentKey || null,
                attachmentError: msg.attachmentError || null,
                attachmentType: msg.attachmentType || null,
                createdAt: msg.createdAt,
                updatedAt: msg.updatedAt,
            });
            __1.io.to(`inbox=${senderId}`).emit("private_message", msg.id, {
                id: msg.id,
                message: msg.message,
                senderId: msg.senderId,
                recipientId: msg.recipientId,
                hasAttachment: msg.hasAttachment,
                attachmentPending: msg.attachmentPending || null,
                attachmentKey: msg.attachmentKey || null,
                attachmentError: msg.attachmentError || null,
                attachmentType: msg.attachmentType || null,
                createdAt: msg.createdAt,
                updatedAt: msg.updatedAt,
            });
            if (hasAttachment) {
                __1.io.to(`inbox=${senderId}`).emit("private_message_request_attachment_upload", msg.id);
            }
        });
    }
    static updatePrivateMessage(id, message, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            let msg;
            try {
                msg = yield prisma_1.default.privateMessage.findUniqueOrThrow({
                    where: { id },
                });
            }
            catch (e) {
                throw new Error("Message does not exist");
            }
            if (msg.senderId !== uid)
                throw new Error("Unauthorized");
            yield prisma_1.default.privateMessage.update({
                where: { id },
                data: {
                    message,
                },
            });
            __1.io.to(`inbox=${msg.recipientId}`).emit("private_message_update", id, {
                message,
            });
            __1.io.to(`inbox=${msg.senderId}`).emit("private_message_update", id, {
                message,
            });
        });
    }
    static deletePrivateMessage(id, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            let msg;
            console.log("Del private msg");
            try {
                msg = yield prisma_1.default.privateMessage.findUniqueOrThrow({
                    where: { id },
                });
                console.log("DELETED MSG : " + JSON.stringify(msg));
            }
            catch (e) {
                throw new Error("Message does not exist");
            }
            if (msg.senderId !== uid)
                throw new Error("Unauthorized");
            yield prisma_1.default.privateMessage.delete({
                where: { id },
            });
            const s3 = new aws_1.default.S3();
            yield new Promise((resolve, reject) => s3.deleteObject({
                Bucket: "prisma-socialmedia",
                Key: String(msg.attachmentKey),
            }, (err, data) => {
                if (err)
                    reject(err);
                resolve();
            }));
            __1.io.to(`inbox=${msg.recipientId}`).emit("private_message_delete", id);
            __1.io.to(`inbox=${msg.senderId}`).emit("private_message_delete", id);
        });
    }
    static deleteConversation(senderId, recipientId) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            __1.io.to(`inbox=${recipientId}`).emit("private_conversation_deleted", senderId);
            __1.io.to(`inbox=${senderId}`).emit("private_conversation_deleted", recipientId);
            const toDelete = yield prisma_1.default.privateMessage.findMany({
                where: { recipientId, senderId },
                select: { attachmentKey: true },
            });
            const s3 = new aws_1.default.S3();
            try {
                for (var _b = __asyncValues(Array.from(toDelete)), _c; _c = yield _b.next(), !_c.done;) {
                    const msg = _c.value;
                    return new Promise((resolve, reject) => s3.deleteObject({
                        Bucket: "prisma-socialmedia",
                        Key: String(msg.attachmentKey),
                    }, (err, data) => {
                        if (err)
                            reject(err);
                        resolve();
                    }));
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            yield prisma_1.default.privateMessage.deleteMany({
                where: { recipientId, senderId },
            });
        });
    }
    static getConversations(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sentMessages = yield prisma_1.default.privateMessage.findMany({
                    where: { senderId: uid },
                });
                const receivedMessages = yield prisma_1.default.privateMessage.findMany({
                    where: { recipientId: uid },
                });
                let uids = [];
                for (const msg of sentMessages) {
                    if (!uids.includes(msg.recipientId) && msg.recipientId !== uid)
                        uids.push(msg.recipientId);
                }
                for (const msg of receivedMessages) {
                    if (!uids.includes(msg.senderId) && msg.senderId !== uid)
                        uids.push(msg.senderId);
                }
                const users = yield prisma_1.default.user.findMany({
                    where: { id: { in: uids } },
                    select: { id: true },
                });
                return users;
            }
            catch (e) {
                console.error(e);
                throw new Error("Internal error");
            }
        });
    }
    static getConversation(recipientId, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sentMessages = yield prisma_1.default.privateMessage.findMany({
                    where: { senderId: uid, recipientId },
                });
                const receivedMessages = yield prisma_1.default.privateMessage.findMany({
                    where: { senderId: recipientId, recipientId: uid },
                });
                return sentMessages
                    .concat(receivedMessages)
                    .sort((msgA, msgB) => msgA.createdAt.getTime() - msgB.createdAt.getTime());
            }
            catch (e) {
                throw new Error(`${e}`);
            }
        });
    }
    static getPrivateMessage(msgId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.privateMessage.findUniqueOrThrow({
                where: { id: msgId },
            });
        });
    }
    /**
     * Breaks the design principle I know, i explained why I did it this
     * way in the route controller file
     */
    static uploadConversationAttachment(stream, info, message, bytes) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let type = "File";
                const s3 = new aws_1.default.S3();
                let p = 0;
                if (info.mimeType.startsWith("video/mp4")) {
                    type = "Video";
                }
                else if (info.mimeType.startsWith("image/jpeg") ||
                    info.mimeType.startsWith("image/jpg") ||
                    info.mimeType.startsWith("image/png")) {
                    type = "Image";
                }
                const hasExtension = info.filename.includes(".");
                const ext = String(mime_types_1.default.extension(info.mimeType));
                const key = `${message.id}.${hasExtension ? info.filename.split(".")[0] : info.filename}.${ext}`;
                s3.upload({
                    Bucket: "prisma-socialmedia",
                    Key: key,
                    Body: stream,
                }, (e, file) => {
                    if (e)
                        reject(e);
                    resolve({ key, type });
                }).on("httpUploadProgress", (e) => {
                    p++;
                    //only send progress updates every 2nd event, otherwise it's probably too many emits
                    if (p === 2) {
                        p = 0;
                        console.log("PROGRESS EMIT TO " + message.recipientId);
                        __1.io.to(`inbox=${message.recipientId}`).emit("private_message_attachment_progress", e.loaded / bytes, message.id);
                        console.log("PROGRESS EMIT TO " + message.senderId);
                        __1.io.to(`inbox=${message.senderId}`).emit("private_message_attachment_progress", e.loaded / bytes, message.id);
                    }
                });
            });
        });
    }
    static conversationAttachmentError(senderId, recipientId, messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                __1.io.to(`inbox=${recipientId}`).emit("private_message_attachment_failed", messageId);
                __1.io.to(`inbox=${senderId}`).emit("private_message_attachment_failed", messageId);
                yield prisma_1.default.privateMessage.update({
                    where: { id: messageId },
                    data: {
                        attachmentError: true,
                        attachmentPending: false,
                    },
                });
            }
            catch (e) {
                console.warn(e);
                throw new Error("Internal error handling error :-(");
            }
        });
    }
    static conversationAttachmentComplete(senderId, recipientId, messageId, type, key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                __1.io.to(`inbox=${recipientId}`).emit("private_message_attachment_complete", messageId, type, key);
                __1.io.to(`inbox=${senderId}`).emit("private_message_attachment_complete", messageId, type, key);
                yield prisma_1.default.privateMessage.update({
                    where: { id: messageId },
                    data: {
                        hasAttachment: true,
                        attachmentError: false,
                        attachmentPending: false,
                        attachmentType: type,
                        attachmentKey: key,
                        updatedAt: new Date(),
                    },
                });
            }
            catch (e) {
                console.warn(e);
                throw new Error("Internal error handling error :-(");
            }
        });
    }
    //Rooms
    static getRooms() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.room.findMany();
        });
    }
    static getRoomById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.room.findUnique({
                where: { id },
                include: {
                    author: { select: { id: true } },
                    members: { select: { id: true } },
                },
            });
        });
    }
    static getRoomByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.room.findFirst({
                where: { name },
                include: {
                    author: { select: { id: true } },
                    members: { select: { id: true } },
                },
            });
        });
    }
    static deleteRoom(roomId, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const matchingRoom = yield prisma_1.default.room.findFirst({
                where: { id: roomId, authorId: uid },
            });
            if (!matchingRoom)
                throw new Error("You either do not own the room, or it does not exist");
            const { id } = yield prisma_1.default.room.delete({
                where: { id: roomId },
                select: { id: true },
            });
            return id;
        });
    }
    static createRoom(name, authorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const roomAlreadyExists = yield prisma_1.default.room.findFirst({
                where: {
                    authorId,
                    name,
                },
            });
            if (roomAlreadyExists)
                throw new Error("You already have a room by that name");
            const usersRooms = yield prisma_1.default.room.findMany({
                where: { authorId },
                select: { _count: true },
            });
            if (usersRooms.length > 8)
                throw new Error("Max 8 rooms");
            return yield prisma_1.default.room.create({
                data: {
                    authorId,
                    name,
                    members: { connect: { id: authorId } },
                },
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                },
            });
        });
    }
    static joinRoom(roomId, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            let room;
            room = yield prisma_1.default.room
                .findUniqueOrThrow({
                where: { id: roomId },
                include: {
                    banned: { select: { id: true } },
                    members: { select: { id: true } },
                },
            })
                .catch((e) => {
                throw new Error("Room does not exist");
            });
            if (!room.public)
                throw new Error("You need an invitation to join this room");
            if (room.banned.includes({ id: uid }))
                throw new Error("You are banned from this room");
            yield prisma_1.default.room.update({
                where: { id: roomId },
                data: { members: { connect: { id: uid } } },
            });
        });
    }
    static banUser(roomId, bannedUid, bannerUid) {
        return __awaiter(this, void 0, void 0, function* () {
            let room;
            room = yield prisma_1.default.room
                .findUniqueOrThrow({
                where: { id: roomId },
                include: {
                    banned: { select: { id: true } },
                    members: { select: { id: true } },
                },
            })
                .catch((e) => {
                throw new Error("Room does not exist");
            });
            if (room.authorId !== bannerUid)
                throw new Error("Only the rooms owner can ban other users");
            if (room.banned.includes({ id: bannedUid }))
                throw new Error("You have already banned this user");
            yield prisma_1.default.room.update({
                where: { id: roomId },
                data: {
                    banned: { connect: { id: bannedUid } },
                    members: { disconnect: { id: bannedUid } },
                },
            });
        });
    }
    static kickUser(roomId, kickedUid, kickerUid) {
        return __awaiter(this, void 0, void 0, function* () {
            let room;
            room = yield prisma_1.default.room
                .findUniqueOrThrow({
                where: { id: roomId },
                include: {
                    banned: { select: { id: true } },
                    members: { select: { id: true } },
                },
            })
                .catch((e) => {
                throw new Error("Room does not exist");
            });
            if (room.authorId !== kickerUid)
                throw new Error("Only the rooms owner can kick other users");
            if (!room.members.includes({ id: kickedUid }))
                throw new Error("The user you want to kick isn't joined to the room");
            if (room.banned.includes({ id: kickedUid }))
                throw new Error("That user is already banned from the room");
            yield prisma_1.default.room.update({
                where: { id: roomId },
                data: {
                    members: { disconnect: { id: kickedUid } },
                },
            });
        });
    }
    static leaveRoom(roomId, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            let room;
            room = yield prisma_1.default.room
                .findUniqueOrThrow({
                where: { id: roomId },
                include: {
                    banned: { select: { id: true } },
                    members: { select: { id: true } },
                },
            })
                .catch((e) => {
                throw new Error("Room does not exist");
            });
            if (room.authorId === uid)
                throw new Error("You cannot leave a room that you own");
            if (!room.members.includes({ id: uid }))
                throw new Error("You cannot leave a room that you aren't already in");
            if (room.banned.includes({ id: uid }))
                throw new Error("You cannot leave a room which you are already banned from");
            yield prisma_1.default.room.update({
                where: { id: roomId },
                data: { members: { disconnect: { id: uid } } },
            });
        });
    }
    static getRoomMessage(msgId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.roomMessage.findUniqueOrThrow({
                where: { id: msgId },
            });
        });
    }
    static uploadRoomAttachment(stream, info, message, bytes) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let type = "File";
                const s3 = new aws_1.default.S3();
                let p = 0;
                if (info.mimeType.startsWith("video/mp4")) {
                    type = "Video";
                }
                else if (info.mimeType.startsWith("image/jpeg") ||
                    info.mimeType.startsWith("image/jpg") ||
                    info.mimeType.startsWith("image/png")) {
                    type = "Image";
                }
                const hasExtension = info.filename.includes(".");
                const ext = String(mime_types_1.default.extension(info.mimeType));
                const key = `${message.id}.${hasExtension ? info.filename.split(".")[0] : info.filename}.${ext}`;
                s3.upload({
                    Bucket: "prisma-socialmedia",
                    Key: key,
                    Body: stream,
                }, (e, file) => {
                    if (e)
                        reject(e);
                    resolve({ key, type });
                }).on("httpUploadProgress", (e) => {
                    p++;
                    //only send progress updates every 2nd event, otherwise it's probably too many emits
                    if (p === 2) {
                        p = 0;
                        __1.io.to(`room=${message.roomId}`).emit("room_message_attachment_progress", e.loaded / bytes, message.id);
                    }
                });
            });
        });
    }
    static roomAttachmentComplete(roomId, messageId, type, key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                __1.io.to(`room=${roomId}`).emit("room_message_attachment_complete", messageId, type, key);
                yield prisma_1.default.roomMessage.update({
                    where: { id: messageId },
                    data: {
                        hasAttachment: true,
                        attachmentError: false,
                        attachmentPending: false,
                        attachmentType: type,
                        attachmentKey: key,
                    },
                });
            }
            catch (e) {
                console.warn(e);
                throw new Error("Internal error handling error :-(");
            }
        });
    }
    static roomAttachmentError(roomId, messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                __1.io.to(`room=${roomId}`).emit("room_message_attachment_failed", messageId);
                yield prisma_1.default.roomMessage.update({
                    where: { id: messageId },
                    data: {
                        attachmentError: true,
                        attachmentPending: false,
                    },
                });
            }
            catch (e) {
                console.warn(e);
                throw new Error("Internal error handling error :-(");
            }
        });
    }
}
exports.default = MessengerDAO;
