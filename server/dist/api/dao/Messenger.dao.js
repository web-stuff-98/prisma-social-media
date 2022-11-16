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
    static sendMessage(message, hasAttachment, recipientId, senderId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (recipientId === senderId) {
                throw new Error("You cannot message yourself");
            }
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
            __1.io.to(`inbox=${recipientId}`).emit("private_message", msg.id, msg.message, msg.senderId, msg.hasAttachment, msg.attachmentType || undefined, msg.attachmentError || undefined, msg.attachmentKey || undefined, msg.attachmentPending || undefined);
            __1.io.to(`inbox=${senderId}`).emit("private_message", msg.id, msg.message, msg.senderId, msg.hasAttachment, msg.attachmentType || undefined, msg.attachmentError || undefined, msg.attachmentKey || undefined, msg.attachmentPending || undefined);
            if (hasAttachment) {
                __1.io.to(`inbox=${senderId}`).emit("private_message_request_attachment_upload", msg.id);
            }
        });
    }
    static updateMessage(id, message, uid) {
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
            __1.io.to(`inbox=${msg.recipientId}`).emit("private_message_update", id, message);
            __1.io.to(`inbox=${msg.senderId}`).emit("private_message_update", id, message);
        });
    }
    static deleteMessage(id, uid) {
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
                    select: { id: true }
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
                const messages = sentMessages
                    .concat(receivedMessages)
                    .sort((msgA, msgB) => msgA.createdAt.getTime() - msgB.createdAt.getTime());
                return messages;
            }
            catch (e) {
                throw new Error(`${e}`);
            }
        });
    }
    static getMessage(msgId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.privateMessage.findUniqueOrThrow({
                where: { id: msgId },
            });
        });
    }
    /**
     * Breaks the design principle I know. Its because I couldn't get busboy.on("file")
     * to fire from inside this file for some weird reason which i cannot figure out.
     */
    static uploadAttachment(stream, info, message, bytes) {
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
                    //only send progress updates every 3rd event, otherwise it's probably too many emits
                    if (p === 3) {
                        p = 0;
                        __1.io.to(`inbox=${message.recipientId}`).emit("private_message_attachment_progress", e.loaded / bytes, message.id);
                        __1.io.to(`inbox=${message.senderId}`).emit("private_message_attachment_progress", e.loaded / bytes, message.id);
                    }
                });
            });
        });
    }
    static attachmentError(senderId, recipientId, messageId) {
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
    static attachmentComplete(senderId, recipientId, messageId, type, key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                __1.io.to(`inbox=${recipientId}`).emit("private_message_attachment_complete", messageId, type, key);
                __1.io.to(`inbox=${senderId}`).emit("private_message_attachment_complete", messageId, type, key);
                yield prisma_1.default.privateMessage.update({
                    where: { id: messageId },
                    data: {
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
}
exports.default = MessengerDAO;
