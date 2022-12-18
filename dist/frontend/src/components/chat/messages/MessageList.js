"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_2 = require("react");
const Message_1 = __importDefault(require("./Message"));
const AuthContext_1 = require("../../../context/AuthContext");
const im_1 = require("react-icons/im");
const md_1 = require("react-icons/md");
function MessageList({ messages, status, error, roomId, }) {
    const messagesBottomRef = (0, react_2.useRef)(null);
    const { user } = (0, AuthContext_1.useAuth)();
    (0, react_2.useEffect)(() => { var _a; return (_a = messagesBottomRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "auto" }); }, [messages]);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [status === "success" && ((0, jsx_runtime_1.jsxs)("div", Object.assign({ style: { maxHeight: "20pc" }, className: "relative overflow-y-scroll flex flex-col gap-2 grow" }, { children: [messages.length > 0 &&
                        messages.map((msg) => ((0, react_1.createElement)(Message_1.default, Object.assign({}, msg, { roomId: roomId, key: msg.id, isServerMessage: !msg.senderId, otherUser: msg.senderId !== (user === null || user === void 0 ? void 0 : user.id), isInvite: !roomId && msg.message.startsWith("INVITATION ") })))), (0, jsx_runtime_1.jsx)("span", { ref: messagesBottomRef, className: "w-full" })] }))), status === "pending" && ((0, jsx_runtime_1.jsx)(im_1.ImSpinner8, { className: "mx-auto my-2 animate-spin text-2xl" })), status === "error" && ((0, jsx_runtime_1.jsx)("div", Object.assign({ className: "flex flex-col gap-2 text-rose-600 gap-2 text-center" }, { children: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(md_1.MdError, {}), `${error}`] }) })))] }));
}
exports.default = MessageList;
