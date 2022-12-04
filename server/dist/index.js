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
exports.io = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
//seed();
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true,
    },
});
exports.io = io;
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use((0, cookie_parser_1.default)(process.env.COOKIE_SECRET));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const socketAuthMiddleware = (socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    yield socketAuth(socket);
    next();
});
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
io.use(socketAuthMiddleware);
io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    yield socketAuth(socket);
    socket.on("auth", () => __awaiter(void 0, void 0, void 0, function* () {
        yield socketAuth(socket);
    }));
    socket.on("user_visible", (uid) => socket.join(`user=${uid}`));
    socket.on("user_not_visible", (uid) => socket.leave(`user=${uid}`));
    socket.on("post_card_visible", (slug) => socket.join(`post_card=${slug}`));
    socket.on("post_card_not_visible", (slug) => socket.leave(`post_card=${slug}`));
    socket.on("open_profile", (uid) => socket.join(`profile=${uid}`));
    socket.on("close_profile", (uid) => socket.leave(`profile=${uid}`));
    socket.on("open_post_comments", (slug) => socket.join(slug));
    socket.on("leave_post_comments", (slug) => socket.leave(slug));
    socket.on("room_video_chat_sending_signal", (payload) => {
        var _a;
        io.to(payload.userToSignal).emit("room_video_chat_user_joined", payload.signal, payload.callerSid, String((_a = socket.data.user) === null || _a === void 0 ? void 0 : _a.id));
    });
    socket.on("room_video_chat_returning_signal", (payload) => {
        io.to(payload.callerSid).emit("room_video_chat_receiving_returned_signal", payload.signal, socket.id);
    });
    socket.on("disconnect", () => {
        if (socket.data.user)
            io.to(`user=${socket.data.user.id}`).emit("user_visible_update", {
                id: socket.data.user.id,
                online: false,
            });
        socket.rooms.forEach((room) => {
            var _a;
            if (room.startsWith("room="))
                io.to(room).emit("room_video_chat_user_left", String((_a = socket.data.user) === null || _a === void 0 ? void 0 : _a.id));
        });
    });
}));
const Posts_route_1 = __importDefault(require("./api/Posts.route"));
const Users_route_1 = __importDefault(require("./api/Users.route"));
const Chat_route_1 = __importDefault(require("./api/Chat.route"));
app.use("/api/posts", Posts_route_1.default);
app.use("/api/users", Users_route_1.default);
app.use("/api/chat", Chat_route_1.default);
server.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}`);
});
