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
exports.io = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const seed_1 = __importDefault(require("./utils/seed"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const aws_1 = __importDefault(require("./utils/aws"));
const socket_io_1 = require("socket.io");
const origin = process.env.NODE_ENV === "production"
    ? [
        "https://prisma-social-media-js.herokuapp.com/",
        "http://prisma-social-media-js.herokuapp.com/",
    ]
    : "http://localhost:3000";
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin,
        credentials: true,
    },
});
exports.io = io;
/*app.use((req, res, next) => {
  if (process.env.NODE_ENV !== "development" && !req.secure) {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next()
})*/
let generatedPostIds;
let generatedUserIds;
let generatedRoomIds;
let seedGeneratedAt;
app.use((0, cors_1.default)({
    origin,
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
if (process.env.NODE_ENV === "production") {
    app.use(express_1.default.static(path_1.default.join(__dirname, "..", "frontend", "build")));
    (0, seed_1.default)().then(({ generatedPosts, generatedUsers, generatedRooms }) => {
        generatedPostIds = generatedPosts;
        generatedUserIds = generatedUsers;
        generatedRoomIds = generatedRooms;
        seedGeneratedAt = new Date();
    });
}
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const socketAuth = (socket) => __awaiter(void 0, void 0, void 0, function* () {
    const rawCookie = socket.handshake.headers.cookie;
    if (rawCookie) {
        try {
            socket.data.user = jsonwebtoken_1.default.verify(rawCookie.replace("token=", ""), String(process.env.JWT_SECRET));
            socket.join(`user=${socket.data.user.id}`);
            socket.join(`inbox=${socket.data.user.id}`);
            socket.data.vidChatOpen = false;
            io.to(`user=${socket.data.user.id}`).emit("user_visible_update", {
                id: socket.data.user.id,
                online: true,
            });
        }
        catch (e) {
            console.warn("User trying to connect to socket with malformed token : " + e);
        }
    }
    else {
        socket.data.user = undefined;
    }
});
io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    yield socketAuth(socket);
    socket.on("user_visible", (uid) => socket.join(`user=${uid}`));
    socket.on("user_not_visible", (uid) => socket.leave(`user=${uid}`));
    socket.on("post_card_visible", (slug) => socket.join(`post_card=${slug}`));
    socket.on("post_card_not_visible", (slug) => socket.leave(`post_card=${slug}`));
    socket.on("open_profile", (uid) => socket.join(`profile=${uid}`));
    socket.on("close_profile", (uid) => socket.leave(`profile=${uid}`));
    socket.on("open_post", (slug) => socket.join(slug));
    socket.on("leave_post", (slug) => socket.leave(slug));
    socket.on("auth", () => __awaiter(void 0, void 0, void 0, function* () { return yield socketAuth(socket); }));
    socket.on("room_video_chat_sending_signal", (payload) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        io.to(payload.userToSignal).emit("room_video_chat_user_joined", payload.signal, payload.callerSid, String((_a = socket.data.user) === null || _a === void 0 ? void 0 : _a.id));
    }));
    socket.on("room_video_chat_returning_signal", (payload) => {
        io.to(payload.callerSid).emit("room_video_chat_receiving_returned_signal", payload.signal, socket.id);
    });
    socket.on("private_conversation_video_chat_sending_signal", (payload) => __awaiter(void 0, void 0, void 0, function* () {
        const calledSocket = yield (0, getUserSocket_1.default)(payload.userToSignal);
        io.to(calledSocket === null || calledSocket === void 0 ? void 0 : calledSocket.id).emit("private_conversation_video_chat_user_joined", payload.signal, socket.id);
    }));
    socket.on("private_conversation_video_chat_returning_signal", (payload) => {
        io.to(payload.callerSid).emit("private_conversation_video_chat_receiving_returned_signal", payload.signal);
    });
    socket.on("private_conversation_open", (subjectUid) => {
        socket.data.vidChatOpen = false;
        socket.data.conversationSubjectUid = subjectUid;
    });
    socket.on("private_conversation_close", () => __awaiter(void 0, void 0, void 0, function* () {
        if (socket.data.vidChatOpen && socket.data.conversationSubjectUid) {
            const otherSocket = yield (0, getUserSocket_1.default)(socket.data.conversationSubjectUid);
            if (otherSocket)
                io
                    .to(otherSocket.id)
                    .emit("private_conversation_video_chat_user_left");
        }
        socket.data.vidChatOpen = false;
        socket.data.conversationSubjectUid = "";
    }));
    socket.on("private_conversation_vid_chat_close", () => __awaiter(void 0, void 0, void 0, function* () {
        socket.data.vidChatOpen = false;
        if (socket.data.conversationSubjectUid) {
            const otherSocket = yield (0, getUserSocket_1.default)(socket.data.conversationSubjectUid);
            if (otherSocket)
                io
                    .to(otherSocket.id)
                    .emit("private_conversation_video_chat_user_left");
        }
    }));
    socket.on("private_conversation_vid_chat_open", () => {
        socket.data.vidChatOpen = true;
    });
    socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
        if (socket.data.user)
            io.to(`user=${socket.data.user.id}`).emit("user_visible_update", {
                id: socket.data.user.id,
                online: false,
            });
        socket.data.user = undefined;
        if (socket.data.vidChatOpen && socket.data.conversationSubjectUid) {
            const otherSocket = yield (0, getUserSocket_1.default)(socket.data.conversationSubjectUid);
            if (otherSocket)
                io.to(otherSocket.id).emit("private_conversation_video_chat_user_left");
        }
        socket.data.vidChatOpen = false;
        socket.data.conversationSubjectUid = "";
        socket.rooms.forEach((room) => {
            var _a;
            if (room.startsWith("room="))
                io.to(room).emit("room_video_chat_user_left", String((_a = socket.data.user) === null || _a === void 0 ? void 0 : _a.id));
        });
    }));
}));
const Posts_route_1 = __importDefault(require("./api/Posts.route"));
const Users_route_1 = __importDefault(require("./api/Users.route"));
const Chat_route_1 = __importDefault(require("./api/Chat.route"));
const getUserSocket_1 = __importDefault(require("./utils/getUserSocket"));
const redis_1 = __importDefault(require("./utils/redis"));
const Users_dao_1 = __importDefault(require("./api/dao/Users.dao"));
const prisma_1 = __importDefault(require("./utils/prisma"));
app.use("/api/posts", Posts_route_1.default);
app.use("/api/users", Users_route_1.default);
app.use("/api/chat", Chat_route_1.default);
app.get("*", (_, res) => {
    res.sendFile(path_1.default.join(__dirname, "..", "frontend", "build", "index.html"));
});
const s3 = new aws_1.default.S3();
server.listen(process.env.PORT || 80, () => {
    console.log(`Server listening on port ${process.env.PORT || 80}`);
    const deleteOldAccsInterval = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        var e_1, _a;
        const keyVal = yield redis_1.default.get("deleteAccountsCountdownList");
        let deleteAccountsCountdownList = [];
        if (keyVal)
            deleteAccountsCountdownList = JSON.parse(keyVal);
        let deletedIds = [];
        try {
            for (var deleteAccountsCountdownList_1 = __asyncValues(deleteAccountsCountdownList), deleteAccountsCountdownList_1_1; deleteAccountsCountdownList_1_1 = yield deleteAccountsCountdownList_1.next(), !deleteAccountsCountdownList_1_1.done;) {
                const info = deleteAccountsCountdownList_1_1.value;
                const deleteAt = new Date(info.deleteAt).getTime();
                if (Date.now() >= deleteAt) {
                    yield Users_dao_1.default.deleteUser(info.id);
                    deletedIds += info.id;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (deleteAccountsCountdownList_1_1 && !deleteAccountsCountdownList_1_1.done && (_a = deleteAccountsCountdownList_1.return)) yield _a.call(deleteAccountsCountdownList_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        yield redis_1.default.set("deleteAccountsCountdownList", JSON.stringify(deleteAccountsCountdownList.filter((info) => !deletedIds.includes(info.id))));
    }), 100000);
    const deleteOldMessagesRoomsAndPostsInterval = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        var e_2, _b, e_3, _c, e_4, _d;
        const twentyMinutesAgo = new Date(Date.now() - 1200000);
        const roomMessages = yield prisma_1.default.roomMessage.findMany({
            where: { createdAt: { lt: twentyMinutesAgo } },
        });
        const privateMessages = yield prisma_1.default.privateMessage.findMany({
            where: { createdAt: { lt: twentyMinutesAgo } },
        });
        try {
            for (var roomMessages_1 = __asyncValues(roomMessages), roomMessages_1_1; roomMessages_1_1 = yield roomMessages_1.next(), !roomMessages_1_1.done;) {
                const m = roomMessages_1_1.value;
                if (m.hasAttachment)
                    yield new Promise((resolve, reject) => {
                        s3.deleteObject({
                            Key: `${process.env.NODE_ENV !== "production" ? "dev." : ""}${m.attachmentKey}`,
                            Bucket: "prisma-socialmedia",
                        }, (err, _) => {
                            if (err)
                                reject(err);
                            resolve();
                        });
                    });
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (roomMessages_1_1 && !roomMessages_1_1.done && (_b = roomMessages_1.return)) yield _b.call(roomMessages_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        try {
            for (var privateMessages_1 = __asyncValues(privateMessages), privateMessages_1_1; privateMessages_1_1 = yield privateMessages_1.next(), !privateMessages_1_1.done;) {
                const m = privateMessages_1_1.value;
                if (m.hasAttachment)
                    yield new Promise((resolve, reject) => {
                        s3.deleteObject({
                            Key: `${process.env.NODE_ENV !== "production" ? "dev." : ""}${m.attachmentKey}`,
                            Bucket: "prisma-socialmedia",
                        }, (err, _) => {
                            if (err)
                                reject(err);
                            resolve();
                        });
                    });
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (privateMessages_1_1 && !privateMessages_1_1.done && (_c = privateMessages_1.return)) yield _c.call(privateMessages_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        yield prisma_1.default.roomMessage.deleteMany({
            where: { createdAt: { lt: twentyMinutesAgo } },
        });
        yield prisma_1.default.privateMessage.deleteMany({
            where: { createdAt: { lt: twentyMinutesAgo } },
        });
        yield prisma_1.default.room.deleteMany({
            where: {
                createdAt: { lt: twentyMinutesAgo },
                id: { notIn: generatedRoomIds },
            },
        });
        yield prisma_1.default.user.deleteMany({
            where: {
                createdAt: { lt: twentyMinutesAgo },
                id: { notIn: generatedUserIds },
            },
        });
        const postsToDelete = yield prisma_1.default.post.findMany({
            where: {
                createdAt: { lt: twentyMinutesAgo },
                id: { notIn: generatedPostIds },
            },
        });
        yield prisma_1.default.post.deleteMany({
            where: {
                id: { notIn: generatedPostIds },
                createdAt: { lt: twentyMinutesAgo },
            },
        });
        try {
            for (var postsToDelete_1 = __asyncValues(postsToDelete), postsToDelete_1_1; postsToDelete_1_1 = yield postsToDelete_1.next(), !postsToDelete_1_1.done;) {
                const p = postsToDelete_1_1.value;
                yield new Promise((resolve, reject) => {
                    s3.deleteObject({
                        Key: `${process.env.NODE_ENV !== "production" ? "dev." : ""}${p.imageKey}`,
                        Bucket: "prisma-socialmedia",
                    }, (err, _) => {
                        if (err)
                            reject(err);
                        resolve();
                    });
                });
                yield new Promise((resolve, reject) => {
                    s3.deleteObject({
                        Key: `${process.env.NODE_ENV !== "production" ? "dev." : ""}thumb.${p.imageKey}`,
                        Bucket: "prisma-socialmedia",
                    }, (err, _) => {
                        if (err)
                            reject(err);
                        resolve();
                    });
                });
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (postsToDelete_1_1 && !postsToDelete_1_1.done && (_d = postsToDelete_1.return)) yield _d.call(postsToDelete_1);
            }
            finally { if (e_4) throw e_4.error; }
        }
        yield prisma_1.default.comment.deleteMany({
            where: { createdAt: { lt: twentyMinutesAgo, gt: seedGeneratedAt } },
        });
    }), 100000);
    return () => {
        clearInterval(deleteOldAccsInterval);
        clearInterval(deleteOldMessagesRoomsAndPostsInterval);
    };
});
