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
            __1.io.to(`inbox=${msg.recipientId}`).emit("private_message_delete", id);
            __1.io.to(`inbox=${msg.senderId}`).emit("private_message_delete", id);
        });
    }
    static deleteConversation(senderId, recipientId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma_1.default.privateMessage.deleteMany({
                    where: { recipientId, senderId },
                });
            }
            catch (e) {
                throw new Error(`${e}`);
            }
        });
    }
    static getConversations(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("UID + " + uid);
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
                    .sort((msgA, msgB) => msgA.timestamp.getTime() - msgB.timestamp.getTime());
                return messages;
            }
            catch (e) {
                throw new Error(`${e}`);
            }
        });
    }
    static uploadAttachment(bb, messageId, bytes) {
        return __awaiter(this, void 0, void 0, function* () {
            let message;
            try {
                message = yield prisma_1.default.privateMessage.findUniqueOrThrow({
                    where: { id: messageId },
                });
            }
            catch (e) {
                throw new Error("Could not find message to upload attachment for");
            }
            return new Promise((resolve, reject) => {
                let type = "File";
                const s3 = new aws_1.default.S3();
                let p = 0;
                bb.on("file", (name, stream, info) => {
                    if (info.mimeType.startsWith("video/mp4")) {
                        type = "Video";
                    }
                    else if (info.mimeType.startsWith("image/jpeg") ||
                        info.mimeType.startsWith("image/jpg") ||
                        info.mimeType.startsWith("image/png")) {
                        type = "Image";
                    }
                    const ext = String(mime_types_1.default.extension(info.mimeType));
                    const key = `${messageId}.${info.filename.replace(".", "")}.${ext}`;
                    console.log(key);
                    s3.upload({
                        Bucket: "prisma-socialmedia",
                        Key: key,
                        Body: stream,
                    }, (e, file) => {
                        if (e)
                            failed(e);
                        success(key);
                    }).on("httpUploadProgress", (e) => {
                        p++;
                        //only send progress updates every 5th event, otherwise its probably too many emits
                        if (p === 5) {
                            p = 0;
                            __1.io.to(`inbox=${message.recipientId}`).emit("private_message_attachment_progress", e.loaded / bytes, messageId);
                            __1.io.to(`inbox=${message.senderId}`).emit("private_message_attachment_progress", e.loaded / bytes, messageId);
                        }
                    });
                    bb.on("error", failed);
                    function failed(e) {
                        return __awaiter(this, void 0, void 0, function* () {
                            console.error(e);
                            __1.io.to(`inbox=${message.recipientId}`).emit("private_message_attachment_failed", messageId);
                            __1.io.to(`inbox=${message.senderId}`).emit("private_message_attachment_failed", messageId);
                            yield prisma_1.default.privateMessage.update({
                                where: { id: messageId },
                                data: {
                                    attachmentError: true,
                                    attachmentPending: false,
                                },
                            });
                            console.log("Error : " + e);
                            reject(e);
                        });
                    }
                    function success(key) {
                        return __awaiter(this, void 0, void 0, function* () {
                            console.log("Success");
                            __1.io.to(`inbox=${message.recipientId}`).emit("private_message_attachment_complete", messageId, type, key);
                            __1.io.to(`inbox=${message.senderId}`).emit("private_message_attachment_complete", messageId, type, key);
                            console.log("Success");
                            yield prisma_1.default.privateMessage.update({
                                where: { id: messageId },
                                data: {
                                    attachmentError: false,
                                    attachmentPending: false,
                                    attachmentType: type,
                                    attachmentKey: key,
                                },
                            });
                            resolve();
                        });
                    }
                });
            });
        });
    }
}
exports.default = MessengerDAO;
