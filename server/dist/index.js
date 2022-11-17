"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
io.on("connection", (socket) => {
    const rawCookie = socket.handshake.headers.cookie;
    if (rawCookie) {
        try {
            socket.data.user = jsonwebtoken_1.default.verify(rawCookie.replace("token=", ""), String(process.env.JWT_SECRET));
            socket.join(socket.data.user.id);
            socket.join(`inbox=${socket.data.user.id}`);
            io.to(socket.data.user.id).emit("user_subscription_update", {
                id: socket.data.user.id,
                online: true,
            });
        }
        catch (e) {
            console.warn("User trying to connect to socket with malformed token : " + e);
            socket.disconnect();
        }
    }
    else {
        socket.data.user = undefined;
    }
    socket.on("subscribe_to_user", (uid) => socket.join(uid));
    socket.on("unsubscribe_to_user", (uid) => socket.leave(uid));
    socket.on("open_post", (slug) => socket.join(slug));
    socket.on("leave_post", (slug) => socket.leave(slug));
    socket.on("disconnect", () => {
        if (socket.data.user)
            io.to(socket.data.user.id).emit("user_subscription_update", {
                id: socket.data.user.id,
                online: false,
            });
    });
});
const Posts_route_1 = __importDefault(require("./api/Posts.route"));
const Users_route_1 = __importDefault(require("./api/Users.route"));
const Chat_route_1 = __importDefault(require("./api/Chat.route"));
app.use("/api/posts", Posts_route_1.default);
app.use("/api/users", Users_route_1.default);
app.use("/api/chat", Chat_route_1.default);
server.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}`);
});
