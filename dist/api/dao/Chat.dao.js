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
const getUserSocket_1 = __importDefault(require("../../utils/getUserSocket"));
const s3 = new aws_1.default.S3();
class ChatDAO {
    static searchUser(name) {
        return __awaiter(this, void 0, void 0, function* () {
            /*
            You could easily make this function faster, couldn't be bothered to figure out the proper way of doing it at the time
            It also returns the user making the search, which it maybe shouldn't do
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
            if (recipientId === senderId)
                throw new Error("You cannot message yourself");
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
            __1.io.to(`inbox=${recipientId}`).emit("private_message", {
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
            __1.io.to(`inbox=${senderId}`).emit("private_message", {
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
    static inviteUser(invited, inviter, roomName) {
        return __awaiter(this, void 0, void 0, function* () {
            let room;
            let invitedU;
            let inviterU;
            try {
                room = yield prisma_1.default.room.findFirstOrThrow({
                    where: {
                        name: { equals: roomName, mode: "insensitive" },
                        authorId: inviter,
                    },
                    include: { members: true, banned: true },
                });
            }
            catch (e) {
                throw new Error("Could not find room to invite user to");
            }
            try {
                invitedU = yield prisma_1.default.user.findUniqueOrThrow({
                    where: { id: invited },
                });
            }
            catch (e) {
                throw new Error("Could not find user to invite to room");
            }
            try {
                inviterU = yield prisma_1.default.user.findUniqueOrThrow({
                    where: { id: inviter },
                });
            }
            catch (e) {
                throw new Error("Your account no longer exists, or could not be found for some reason.");
            }
            if (room.members.find((u) => u.id === invited))
                throw new Error(`${invitedU.name} is already a member of ${room.name}`);
            if (room.banned.find((u) => u.id === invited))
                throw new Error(`${invitedU.name} is banned from the room.${inviterU.id === room.authorId
                    ? " You must first unban the user before inviting them."
                    : " The owner of the room has banned this user."}`);
            /*Send the message which will be used by the frontend as an invitation.*/
            const msgData = yield prisma_1.default.privateMessage.create({
                data: {
                    senderId: inviter,
                    recipientId: invited,
                    message: `INVITATION ${room.name}`,
                },
            });
            __1.io.to(`inbox=${inviter}`).emit("private_message", msgData);
            __1.io.to(`inbox=${invited}`).emit("private_message", msgData);
        });
    }
    static declineInvite(invited, inviter, roomName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma_1.default.user.findUniqueOrThrow({
                    where: { id: invited },
                    select: { id: true },
                });
            }
            catch (e) {
                throw new Error("Could not find your account");
            }
            try {
                yield prisma_1.default.user.findUniqueOrThrow({
                    where: { id: inviter },
                    select: { id: true },
                });
            }
            catch (e) {
                throw new Error("Could not find the user who sent this invitation.");
            }
            const room = yield prisma_1.default.room.findFirst({
                where: {
                    name: {
                        equals: roomName,
                        mode: "insensitive",
                    },
                    authorId: inviter,
                },
            });
            const findInvitationMessages = () => prisma_1.default.privateMessage
                .findMany({
                where: {
                    senderId: inviter,
                    recipientId: invited,
                    message: {
                        equals: `INVITATION ${room === null || room === void 0 ? void 0 : room.name}`,
                        mode: "insensitive",
                    },
                },
                select: { id: true },
            })
                .then((msgs) => msgs.map((msg) => msg.id));
            const msgIds = yield findInvitationMessages();
            const deleteInvitationMessages = () => __awaiter(this, void 0, void 0, function* () {
                /*doesn't actually delete the invitation(s), it just changes
                them to say the invitation was declined*/
                yield prisma_1.default.privateMessage.updateMany({
                    where: { id: { in: msgIds } },
                    data: {
                        senderId: null,
                        message: `Invitation to ${room === null || room === void 0 ? void 0 : room.name} declined ❌`,
                    },
                });
            });
            if (!room) {
                throw new Error("Could not find room to decline invitation for. It was either deleted or changed names. Ask the owner to send a new invite.");
            }
            yield deleteInvitationMessages();
            msgIds.forEach((id) => {
                const msgData = {
                    senderId: inviter,
                    recipientId: invited,
                    message: `Invitation to ${room === null || room === void 0 ? void 0 : room.name} declined ❌`,
                    id: id,
                };
                __1.io.to(`inbox=${inviter}`).emit("private_message_update", msgData);
                __1.io.to(`inbox=${invited}`).emit("private_message_update", msgData);
            });
        });
    }
    static acceptInvite(invited, inviter, roomName) {
        return __awaiter(this, void 0, void 0, function* () {
            let invitedU;
            try {
                invitedU = yield prisma_1.default.user.findUniqueOrThrow({
                    where: { id: invited },
                });
            }
            catch (e) {
                throw new Error("Could not find your account");
            }
            try {
                yield prisma_1.default.user.findUniqueOrThrow({
                    where: { id: inviter },
                });
            }
            catch (e) {
                throw new Error("Could not find the user who sent this invitation.");
            }
            const room = yield prisma_1.default.room.findFirst({
                where: {
                    name: {
                        equals: roomName,
                        mode: "insensitive",
                    },
                    authorId: inviter,
                },
            });
            const findInvitationMessages = () => prisma_1.default.privateMessage
                .findMany({
                where: {
                    senderId: inviter,
                    recipientId: invited,
                    message: {
                        equals: `INVITATION ${room === null || room === void 0 ? void 0 : room.name}`,
                        mode: "insensitive",
                    },
                },
                select: { id: true },
            })
                .then((msgs) => msgs.map((msg) => msg.id).filter((msgId) => msgId));
            const msgIds = yield findInvitationMessages();
            const acceptInvitationMessages = () => __awaiter(this, void 0, void 0, function* () {
                /*change all the invitation messages to say that
                they were accepted*/
                yield prisma_1.default.privateMessage.updateMany({
                    where: { id: { in: msgIds } },
                    data: {
                        senderId: null,
                        message: `Invitation to ${room === null || room === void 0 ? void 0 : room.name} accepted ✅`,
                    },
                });
            });
            if (!room) {
                throw new Error("Could not find room to accept invitation for. It was either deleted or changed names. Ask the owner to send a new invite.");
            }
            yield acceptInvitationMessages();
            msgIds.forEach((id) => {
                const msgData = {
                    senderId: inviter,
                    recipientId: invited,
                    message: `Invitation to ${room === null || room === void 0 ? void 0 : room.name} accepted ✅`,
                    id: id,
                };
                __1.io.to(`inbox=${inviter}`).emit("private_message_update", msgData);
                __1.io.to(`inbox=${invited}`).emit("private_message_update", msgData);
            });
            yield prisma_1.default.room.update({
                where: { id: room.id },
                data: { members: { connect: { id: invited } } },
            });
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
            __1.io.to(`inbox=${msg.recipientId}`).emit("private_message_update", {
                id,
                message,
            });
            __1.io.to(`inbox=${msg.senderId}`).emit("private_message_update", {
                id,
                message,
            });
        });
    }
    static deletePrivateMessage(id, uid) {
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
            if (msg.hasAttachment) {
                yield new Promise((resolve, reject) => s3.deleteObject({
                    Bucket: "prisma-socialmedia",
                    Key: `${process.env.NODE_ENV !== "production"
                        ? "dev."
                        : "" + String(msg.attachmentKey)}`,
                }, (err, data) => {
                    if (err)
                        reject(err);
                    resolve();
                }));
            }
            yield prisma_1.default.privateMessage.delete({
                where: { id },
            });
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
            try {
                for (var _b = __asyncValues(Array.from(toDelete)), _c; _c = yield _b.next(), !_c.done;) {
                    const msg = _c.value;
                    return new Promise((resolve, reject) => s3.deleteObject({
                        Bucket: "prisma-socialmedia",
                        Key: `${process.env.NODE_ENV !== "production"
                            ? "dev."
                            : "" + String(msg.attachmentKey)}`,
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
                    if (msg.recipientId)
                        if (!uids.includes(msg.recipientId) && msg.recipientId !== uid)
                            uids.push(msg.recipientId);
                }
                for (const msg of receivedMessages) {
                    if (msg.senderId)
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
                    Key: `${process.env.NODE_ENV !== "production" ? "dev." : "" + key}`,
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
                        __1.io.to(`inbox=${message.recipientId}`).emit("private_message_attachment_progress", e.loaded / bytes, message.id);
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
            return yield prisma_1.default.room.findMany({
                select: {
                    id: true,
                    name: true,
                    authorId: true,
                    members: { select: { id: true } },
                    banned: { select: { id: true } },
                    public: true,
                },
            });
        });
    }
    static getRoomById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.room.findUnique({
                where: { id },
                select: {
                    authorId: true,
                    id: true,
                    name: true,
                    members: { select: { id: true } },
                    banned: { select: { id: true } },
                    public: true,
                },
            });
        });
    }
    static getRoomByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.room.findFirst({
                where: { name },
                select: {
                    authorId: true,
                    id: true,
                    name: true,
                    members: { select: { id: true } },
                    banned: { select: { id: true } },
                    public: true,
                },
            });
        });
    }
    static getRoomMessages(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let room;
            try {
                room = yield prisma_1.default.room.findUniqueOrThrow({
                    where: { id },
                    select: { messages: true },
                });
            }
            catch (e) {
                throw new Error("Room does not exist");
            }
            return room.messages;
        });
    }
    static deleteRoom(roomId, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const matchingRoom = yield prisma_1.default.room.findFirst({
                where: { id: roomId, authorId: uid },
            });
            if (!matchingRoom)
                throw new Error("You either do not own the room, or it does not exist");
            yield prisma_1.default.room.delete({
                where: { id: roomId },
            });
            __1.io.emit("room_deleted", roomId);
            return roomId;
        });
    }
    static createRoom(name, authorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const roomAlreadyExists = yield prisma_1.default.room.findFirst({
                where: {
                    authorId,
                    name: {
                        equals: name,
                        mode: "insensitive",
                    },
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
            const room = yield prisma_1.default.room.create({
                data: {
                    authorId,
                    name,
                    members: { connect: { id: authorId } },
                },
                include: {
                    members: { select: { id: true } },
                    banned: { select: { id: true } },
                },
            });
            __1.io.emit("room_created", room);
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
            if (!room.public && !room.members.find((member) => member.id === uid))
                throw new Error("You need an invitation to join this room. If the owner has sent you an invitation then you can accept it by finding the message in the conversations section.");
            if (room.banned.find((banned) => banned.id === uid))
                throw new Error("You are banned from this room");
            yield prisma_1.default.room.update({
                where: { id: roomId },
                data: { members: { connect: { id: uid } } },
            });
            const user = yield prisma_1.default.user.findFirst({
                where: { id: uid },
                select: { name: true },
            });
            const serverMessage = yield prisma_1.default.roomMessage.create({
                data: {
                    message: `${user === null || user === void 0 ? void 0 : user.name} has joined the room`,
                    hasAttachment: false,
                    roomId,
                },
            });
            __1.io.to(`room=${roomId}`).emit("room_message", {
                id: serverMessage.id,
                roomId,
                message: serverMessage.message,
                senderId: "",
                hasAttachment: false,
                attachmentPending: null,
                attachmentKey: null,
                attachmentError: null,
                attachmentType: null,
                createdAt: serverMessage.createdAt,
                updatedAt: serverMessage.updatedAt,
            });
            const usersSocket = yield (0, getUserSocket_1.default)(uid);
            if (usersSocket)
                usersSocket.join(`room=${roomId}`);
        });
    }
    static banUser(roomId, bannedUid, bannerUid) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let room;
            if (bannedUid === bannerUid)
                throw new Error("You cannot ban yourself");
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
            if (room.banned.find((banned) => banned.id === bannedUid))
                throw new Error("You have already banned this user");
            yield prisma_1.default.room.update({
                where: { id: roomId },
                data: {
                    banned: { connect: { id: bannedUid } },
                    members: { disconnect: { id: bannedUid } },
                },
            });
            const bannedUser = yield prisma_1.default.user.findFirst({
                where: { id: bannedUid },
                select: { name: true },
            });
            const bannerUser = yield prisma_1.default.user.findFirst({
                where: { id: bannerUid },
                select: { name: true },
            });
            const serverMessage = yield prisma_1.default.roomMessage.create({
                data: {
                    message: `${bannedUser === null || bannedUser === void 0 ? void 0 : bannedUser.name} was banned from the room by ${bannerUser === null || bannerUser === void 0 ? void 0 : bannerUser.name}`,
                    hasAttachment: false,
                    roomId,
                },
            });
            __1.io.to(`room=${roomId}`).emit("room_message", {
                id: serverMessage.id,
                roomId,
                message: serverMessage.message,
                senderId: "",
                hasAttachment: false,
                attachmentPending: null,
                attachmentKey: null,
                attachmentError: null,
                attachmentType: null,
                createdAt: serverMessage.createdAt,
                updatedAt: serverMessage.updatedAt,
            });
            const usersSocket = yield (0, getUserSocket_1.default)(bannedUid);
            if (usersSocket) {
                usersSocket.leave(`room=${roomId}`);
                usersSocket.data.vidChatOpen = false;
                __1.io.to(`room=${roomId}`).emit("room_video_chat_user_left", String((_a = usersSocket.data.user) === null || _a === void 0 ? void 0 : _a.id));
            }
            __1.io.emit("room_updated", Object.assign(Object.assign({}, room), { banned: [...room.banned, { id: bannedUid }], members: room.members.filter((obj) => obj.id !== bannedUid) }));
        });
    }
    static unbanUser(roomId, bannedUid, bannerUid) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let room;
            if (bannedUid === bannerUid)
                throw new Error("You cannot unban yourself");
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
                throw new Error("Only the rooms owner can unban users");
            if (!room.banned.find((banned) => banned.id === bannedUid))
                throw new Error("This user is not banned");
            yield prisma_1.default.room.update({
                where: { id: roomId },
                data: {
                    banned: { disconnect: { id: bannedUid } },
                },
            });
            const bannedUser = yield prisma_1.default.user.findFirst({
                where: { id: bannedUid },
                select: { name: true },
            });
            const bannerUser = yield prisma_1.default.user.findFirst({
                where: { id: bannerUid },
                select: { name: true },
            });
            const serverMessage = yield prisma_1.default.roomMessage.create({
                data: {
                    message: `${bannedUser === null || bannedUser === void 0 ? void 0 : bannedUser.name} was unbanned by ${bannerUser === null || bannerUser === void 0 ? void 0 : bannerUser.name}`,
                    hasAttachment: false,
                    roomId,
                },
            });
            __1.io.to(`room=${roomId}`).emit("room_message", {
                id: serverMessage.id,
                roomId,
                message: serverMessage.message,
                senderId: "",
                hasAttachment: false,
                attachmentPending: null,
                attachmentKey: null,
                attachmentError: null,
                attachmentType: null,
                createdAt: serverMessage.createdAt,
                updatedAt: serverMessage.updatedAt,
            });
            const usersSocket = yield (0, getUserSocket_1.default)(bannedUid);
            if (usersSocket) {
                usersSocket.leave(`room=${roomId}`);
                usersSocket.data.vidChatOpen = false;
                __1.io.to(`room=${roomId}`).emit("room_video_chat_user_left", String((_a = usersSocket.data.user) === null || _a === void 0 ? void 0 : _a.id));
            }
            __1.io.emit("room_updated", Object.assign(Object.assign({}, room), { banned: room.banned.filter((obj) => obj.id !== bannedUid) }));
        });
    }
    static kickUser(roomId, kickedUid, kickerUid) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let room;
            if (kickedUid === kickerUid)
                throw new Error("You cannot kick yourself");
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
            if (!room.members.find((u) => u.id === kickedUid))
                throw new Error("The user you want to kick isn't joined to the room");
            if (room.banned.find((banned) => banned.id === kickedUid))
                throw new Error("That user is already banned from the room");
            yield prisma_1.default.room.update({
                where: { id: roomId },
                data: {
                    members: { disconnect: { id: kickedUid } },
                },
            });
            const kickedUser = yield prisma_1.default.user.findFirst({
                where: { id: kickedUid },
                select: { name: true },
            });
            const kickerUser = yield prisma_1.default.user.findFirst({
                where: { id: kickerUid },
                select: { name: true },
            });
            const serverMessage = yield prisma_1.default.roomMessage.create({
                data: {
                    message: `${kickedUser === null || kickedUser === void 0 ? void 0 : kickedUser.name} was kicked from the room by ${kickerUser === null || kickerUser === void 0 ? void 0 : kickerUser.name}`,
                    hasAttachment: false,
                    roomId,
                },
            });
            yield prisma_1.default.room.update({
                where: { id: roomId },
                data: { members: { disconnect: { id: kickedUid } } },
            });
            __1.io.to(`room=${roomId}`).emit("room_message", {
                id: serverMessage.id,
                roomId,
                message: serverMessage.message,
                senderId: "",
                hasAttachment: false,
                attachmentPending: null,
                attachmentKey: null,
                attachmentError: null,
                attachmentType: null,
                createdAt: serverMessage.createdAt,
                updatedAt: serverMessage.updatedAt,
            });
            const usersSocket = yield (0, getUserSocket_1.default)(kickedUid);
            if (usersSocket) {
                usersSocket.leave(`room=${roomId}`);
                usersSocket.data.vidChatOpen = false;
                __1.io.to(`room=${roomId}`).emit("room_video_chat_user_left", String((_a = usersSocket.data.user) === null || _a === void 0 ? void 0 : _a.id));
            }
            __1.io.emit("room_updated", {
                members: room.members.filter((m) => m.id !== kickedUid),
            });
        });
    }
    static leaveRoom(roomId, uid) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            yield prisma_1.default.room
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
            const user = yield prisma_1.default.user.findFirst({
                where: { id: uid },
                select: { name: true },
            });
            const serverMessage = yield prisma_1.default.roomMessage.create({
                data: {
                    message: `${user === null || user === void 0 ? void 0 : user.name} has left the room`,
                    hasAttachment: false,
                    roomId,
                },
            });
            __1.io.to(`room=${roomId}`).emit("room_message", {
                id: serverMessage.id,
                roomId,
                message: serverMessage.message,
                senderId: "",
                hasAttachment: false,
                attachmentPending: null,
                attachmentKey: null,
                attachmentError: null,
                attachmentType: null,
                createdAt: serverMessage.createdAt,
                updatedAt: serverMessage.updatedAt,
            });
            const usersSocket = yield (0, getUserSocket_1.default)(uid);
            if (usersSocket) {
                usersSocket.leave(`room=${roomId}`);
                usersSocket.data.vidChatOpen = false;
                __1.io.to(`room=${roomId}`).emit("room_video_chat_user_left", String((_a = usersSocket.data.user) === null || _a === void 0 ? void 0 : _a.id));
            }
        });
    }
    static getRoomMessage(msgId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.roomMessage.findUniqueOrThrow({
                where: { id: msgId },
            });
        });
    }
    static sendRoomMessage(message, hasAttachment, senderId, roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            const msg = hasAttachment
                ? yield prisma_1.default.roomMessage.create({
                    data: {
                        message,
                        senderId,
                        roomId,
                        hasAttachment: true,
                        attachmentPending: true,
                    },
                })
                : yield prisma_1.default.roomMessage.create({
                    data: {
                        message,
                        senderId,
                        roomId,
                        hasAttachment: false,
                        attachmentError: false,
                        attachmentPending: false,
                    },
                });
            __1.io.to(`room=${roomId}`).emit("room_message", {
                id: msg.id,
                roomId,
                message: msg.message,
                senderId: msg.senderId,
                hasAttachment: msg.hasAttachment,
                attachmentPending: msg.attachmentPending || null,
                attachmentKey: msg.attachmentKey || null,
                attachmentError: msg.attachmentError || null,
                attachmentType: msg.attachmentType || null,
                createdAt: msg.createdAt,
                updatedAt: msg.updatedAt,
            });
            if (hasAttachment) {
                __1.io.to(`room=${roomId}`).emit("room_message_request_attachment_upload", msg.id);
            }
        });
    }
    static updateRoomMessage(id, message, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            let msg;
            try {
                msg = yield prisma_1.default.roomMessage.findUniqueOrThrow({
                    where: { id },
                });
            }
            catch (e) {
                throw new Error("Message does not exist");
            }
            if (msg.senderId !== uid)
                throw new Error("Unauthorized");
            yield prisma_1.default.roomMessage.update({
                where: { id },
                data: {
                    message,
                },
            });
            __1.io.to(`room=${msg.roomId}`).emit("room_message_update", id, {
                message,
            });
        });
    }
    static updateRoom(roomId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield prisma_1.default.room.update({
                where: { id: roomId },
                data,
            });
            __1.io.emit("room_updated", Object.assign({ id: roomId }, data));
        });
    }
    static getRoomUsers(roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const room = yield prisma_1.default.room.findUniqueOrThrow({
                    where: { id: roomId },
                    select: {
                        banned: { select: { id: true } },
                        members: { select: { id: true } },
                    },
                });
                return {
                    banned: room.banned.map((obj) => obj.id),
                    members: room.members.map((obj) => obj.id),
                };
            }
            catch (e) {
                throw new Error("Room does not exist");
            }
        });
    }
    static deleteRoomMessage(id, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            let msg;
            try {
                msg = yield prisma_1.default.roomMessage.findUniqueOrThrow({
                    where: { id },
                });
            }
            catch (e) {
                throw new Error("Message does not exist");
            }
            if (msg.senderId !== uid)
                throw new Error("Unauthorized");
            if (msg.hasAttachment) {
                const s3 = new aws_1.default.S3();
                yield new Promise((resolve, reject) => s3.deleteObject({
                    Bucket: "prisma-socialmedia",
                    Key: `${process.env.NODE_ENV !== "production" ? "dev." : "" + String(msg.attachmentKey)}`,
                }, (err, data) => {
                    if (err)
                        reject(err);
                    resolve();
                }));
            }
            yield prisma_1.default.roomMessage.delete({
                where: { id },
            });
            __1.io.to(`room=${msg.roomId}`).emit("room_message_delete", id);
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
                    Key: `${process.env.NODE_ENV !== "production" ? "dev." : "" + key}`,
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
    static roomOpenVideoChat(uid, roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            const socket = yield (0, getUserSocket_1.default)(uid);
            if (!socket)
                throw new Error("User has no socket connection");
            const sids = (yield __1.io.in(`room=${roomId}`).fetchSockets())
                .filter((s) => s.data.vidChatOpen)
                .map((s) => ({ sid: s.id, uid: s.data.user.id }))
                .filter((ids) => ids.sid !== socket.id);
            socket.data.vidChatOpen = true;
            socket.emit("room_video_chat_all_users", sids);
        });
    }
    static conversationOpenVideoChat(uid, otherUsersId) {
        return __awaiter(this, void 0, void 0, function* () {
            const callerSocket = yield (0, getUserSocket_1.default)(uid);
            const calledSocket = yield (0, getUserSocket_1.default)(otherUsersId);
            if (!callerSocket)
                throw new Error("You have no socket connection");
            callerSocket.data.vidChatOpen = true;
            if (!calledSocket)
                throw new Error("The user you tried to call is not online");
            if (calledSocket.data.vidChatOpen &&
                calledSocket.data.conversationSubjectUid === uid)
                callerSocket.emit("private_conversation_video_chat_user", calledSocket.id);
        });
    }
}
exports.default = ChatDAO;
