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
/**
 * Messenger specific socket.io event listener functions
 */
class MessengerDAO {
    static sendMessage(message, hasAttachment, recipientId, senderId) {
        return __awaiter(this, void 0, void 0, function* () {
            hasAttachment ? (yield prisma_1.default.privateMessage.create({
                data: {
                    message,
                    senderId,
                    recipientId,
                    attachmentType: undefined,
                    attachmentPending: true,
                    attachmentError: false,
                },
            })) || (yield prisma_1.default.privateMessage.create({
                data: {
                    message,
                    senderId,
                    recipientId,
                    attachmentType: undefined,
                    attachmentError: false,
                    attachmentPending: false,
                },
            }))
                :
            ;
        });
    }
    static uploadAttachment(bb, messageId, bytes) {
        return __awaiter(this, void 0, void 0, function* () {
            let type = "File";
            bb.on("file", (name, stream, info) => {
                if (info.mimeType.startsWith("video/mp4")) {
                    type = "Video";
                }
                else if (info.mimeType.startsWith("image/jpeg") ||
                    info.mimeType.startsWith("image/png")) {
                    type = "Image";
                }
                //stuff here
            });
        });
    }
}
exports.default = MessengerDAO;
