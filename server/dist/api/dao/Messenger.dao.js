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
const getUserSocket_1 = __importDefault(require("../../utils/getUserSocket"));
class MessengerDAO {
    static sendMessage(message, hasAttachment, recipientId, senderId) {
        return __awaiter(this, void 0, void 0, function* () {
            hasAttachment
                ? yield prisma_1.default.privateMessage.create({
                    data: {
                        message,
                        senderId,
                        recipientId,
                        attachmentType: undefined,
                        attachmentPending: true,
                        attachmentError: false,
                    },
                })
                : yield prisma_1.default.privateMessage.create({
                    data: {
                        message,
                        senderId,
                        recipientId,
                        attachmentType: undefined,
                        attachmentError: false,
                        attachmentPending: false,
                    },
                });
        });
    }
    static offerAcceptFriendship(senderId, recipientId) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    static denyCancelFriendship(denierUid, deniedUid) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const senderSocket = yield (0, getUserSocket_1.default)(message.senderId);
            const recipientSocket = yield (0, getUserSocket_1.default)(message.recipientId);
            return new Promise((resolve, reject) => {
                let type = "File";
                const s3 = new aws_1.default.S3();
                let p = 0;
                bb.on("file", (name, stream, info) => {
                    if (info.mimeType.startsWith("video/mp4")) {
                        type = "Video";
                    }
                    else if (info.mimeType.startsWith("image/jpeg") ||
                        info.mimeType.startsWith("image/png")) {
                        type = "Image";
                    }
                    const ext = String(mime_types_1.default.extension(info.mimeType));
                    const key = `${messageId}.${info.filename}.${ext}`;
                    console.log(`Uploading file to S3 with key : ${key}`);
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
                        //only send progress updates every 3rd event, otherwise its too many emits
                        if (p === 3) {
                            p = 0;
                            __1.io.to(recipientSocket.id).emit("private_message_attachment_progress", e.loaded / bytes, messageId);
                            __1.io.to(senderSocket.id).emit("private_message_attachment_progress", e.loaded / bytes, messageId);
                        }
                    });
                    bb.on("error", failed);
                    function failed(e) {
                        return __awaiter(this, void 0, void 0, function* () {
                            __1.io.to(recipientSocket.id).emit("private_message_attachment_failed", messageId);
                            __1.io.to(senderSocket.id).emit("private_message_attachment_failed", messageId);
                            yield prisma_1.default.privateMessage.update({
                                where: { id: messageId },
                                data: {
                                    attachmentError: true,
                                    attachmentPending: false,
                                },
                            });
                            reject(e);
                        });
                    }
                    function success(key) {
                        return __awaiter(this, void 0, void 0, function* () {
                            __1.io.to(recipientSocket.id).emit("private_message_attachment_complete", messageId, type);
                            __1.io.to(senderSocket.id).emit("private_message_attachment_complete", messageId, type);
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
