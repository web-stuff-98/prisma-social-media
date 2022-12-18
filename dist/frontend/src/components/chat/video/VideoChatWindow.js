"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const IconBtn_1 = require("../../IconBtn");
const react_1 = require("react");
const bs_1 = require("react-icons/bs");
const tfi_1 = require("react-icons/tfi");
const AuthContext_1 = require("../../../context/AuthContext");
const im_1 = require("react-icons/im");
const User_1 = __importDefault(require("../../User"));
const UsersContext_1 = __importDefault(require("../../../context/UsersContext"));
const ChatContext_1 = require("../../../context/ChatContext");
/*
  For the client only stream and UID are used, peer is left undefined.

  For other streams the stream is received from the peer, UID is still
  required.
*/
function VideoChatWindow({ size, stream, uid, peer, }) {
    const { user } = (0, AuthContext_1.useAuth)();
    const { getUserData } = (0, UsersContext_1.default)();
    const { selfMuted, toggleMuteSelf } = (0, ChatContext_1.useChat)();
    const videoRef = (0, react_1.useRef)();
    const [streaming, setStreaming] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            setStreaming(true);
        }
    }, [stream]);
    const handleStream = (stream) => {
        videoRef.current.srcObject = stream;
        setStreaming(true);
    };
    (0, react_1.useEffect)(() => {
        peer === null || peer === void 0 ? void 0 : peer.on("stream", handleStream);
        return () => {
            peer === null || peer === void 0 ? void 0 : peer.off("stream", handleStream);
        };
    }, []);
    const [muted, setMuted] = (0, react_1.useState)(false);
    return ((0, jsx_runtime_1.jsx)("div", Object.assign({ style: { maxWidth: "50%" }, className: `w-${size} p-0.5 z-50` }, { children: (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "relative h-full w-full rounded shadow overflow-hidden bg-foreground dark:bg-darkmodeForeground border border-zinc-600 dark:border-stone-800 flex flex-col" }, { children: [(0, jsx_runtime_1.jsxs)("span", Object.assign({ "aria-label": "Partner stream controls", className: "absolute pl-0.5 bg-stone-900 border-b border-stone-800 text-white shadow-md py-1 w-full h-6 flex items-center justify-between" }, { children: [(0, jsx_runtime_1.jsx)(User_1.default, { micro: true, uid: uid, user: getUserData(uid) }), (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "flex gap-0.5 pr-0.5" }, { children: [(0, jsx_runtime_1.jsx)(IconBtn_1.IconBtn, { onClick: () => {
                                        if (uid !== (user === null || user === void 0 ? void 0 : user.id)) {
                                            setMuted(!muted);
                                        }
                                        else if (toggleMuteSelf) {
                                            toggleMuteSelf();
                                        }
                                    }, Icon: (typeof selfMuted !== undefined ? selfMuted : muted)
                                        ? bs_1.BsMicMute
                                        : bs_1.BsMic }), (0, jsx_runtime_1.jsx)(IconBtn_1.IconBtn, { onClick: () => {
                                        videoRef.current.requestFullscreen();
                                    }, Icon: tfi_1.TfiFullscreen })] }))] })), (0, jsx_runtime_1.jsx)("video", { muted: uid === (user === null || user === void 0 ? void 0 : user.id) || muted, autoPlay: true, playsInline: true, ref: videoRef, style: Object.assign(Object.assign({}, (streaming
                        ? { filter: "opacity(1)" }
                        : { filter: "opacity(0)" })), { transition: "filter 150ms ease" }), className: "mt-6 z-20 grow" }), (0, jsx_runtime_1.jsx)("div", Object.assign({ style: Object.assign(Object.assign({}, (streaming
                        ? { filter: "opacity(0)" }
                        : { filter: "opacity(1)" })), { transition: "filter 150ms ease" }), className: "absolute w-full h-full mt-6 h-11 flex items-center justify-center" }, { children: (0, jsx_runtime_1.jsx)(im_1.ImSpinner8, { className: "animate-spin drop-shadow text-2xl grow" }) }))] })) })));
}
exports.default = VideoChatWindow;
