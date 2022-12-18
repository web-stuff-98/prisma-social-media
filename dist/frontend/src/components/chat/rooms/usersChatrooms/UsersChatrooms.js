"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const AuthContext_1 = require("../../../../context/AuthContext");
const ChatContext_1 = require("../../../../context/ChatContext");
const MessengerError_1 = __importDefault(require("../../MessengerError"));
const Room_1 = __importDefault(require("../Room"));
function UsersChatrooms() {
    const { rooms } = (0, ChatContext_1.useChat)();
    const { user } = (0, AuthContext_1.useAuth)();
    const [err, setErr] = (0, react_1.useState)("");
    return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "w-full h-full" }, { children: [(0, jsx_runtime_1.jsx)("div", Object.assign({ style: { maxHeight: "20rem" }, className: "flex overflow-y-auto flex-col justify-start gap-1 p-1 w-full" }, { children: rooms
                    .filter((room) => room.authorId === (user === null || user === void 0 ? void 0 : user.id))
                    .map((r) => ((0, jsx_runtime_1.jsx)(Room_1.default, { setErr: setErr, room: r }, r.id))) })), err && (0, jsx_runtime_1.jsx)(MessengerError_1.default, { err: err, closeError: () => setErr("") })] })));
}
exports.default = UsersChatrooms;
