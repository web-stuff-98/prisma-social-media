"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const VideoChatWindow_1 = __importDefault(require("./VideoChatWindow"));
const react_scrollbar_size_1 = __importDefault(require("react-scrollbar-size"));
const AuthContext_1 = require("../../../context/AuthContext");
const ChatContext_1 = require("../../../context/ChatContext");
/*
  For the client only stream and UID are used, peer is left undefined.

  For other streams the stream is received from the peer, UID is still
  required.
*/
function Videos({ peersData, windowSize }) {
    const { width: scrollWidth } = (0, react_scrollbar_size_1.default)();
    const { user } = (0, AuthContext_1.useAuth)();
    const { userStream } = (0, ChatContext_1.useChat)();
    return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ style: {
            width: `calc(100% - ${scrollWidth}px)`,
            background: "rgba(0,0,0,0.75)",
        }, className: "w-full absolute p-0.5 flex border-b border-stone-600 dark:border-stone-800 flex-wrap z-40" }, { children: [user && userStream && ((0, jsx_runtime_1.jsx)(VideoChatWindow_1.default, { size: windowSize, uid: user.id, stream: userStream.current })), peersData.map((vidWinData) => ((0, jsx_runtime_1.jsx)(VideoChatWindow_1.default, { size: windowSize, uid: vidWinData.peerUID, peer: vidWinData.peer }, vidWinData.peerSID)))] })));
}
exports.default = Videos;
