"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const AuthContext_1 = require("../../../context/AuthContext");
const ChatContext_1 = require("../../../context/ChatContext");
const chat_1 = require("../../../services/chat");
const IconBtn_1 = require("../../IconBtn");
const tb_1 = require("react-icons/tb");
const ri_1 = require("react-icons/ri");
function Room({ room, setErr }) {
    const { user } = (0, AuthContext_1.useAuth)();
    const { setChatSection, setRoomId, openRoomEditor } = (0, ChatContext_1.useChat)();
    return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ style: room.public || room.authorId === (user === null || user === void 0 ? void 0 : user.id)
            ? {}
            : { filter: "opacity(0.5)" }, className: "leading-5 flex justify-between items-center text-xs font-bold rounded-sm border dark:border-stone-800 shadow px-1 w-full py-1" }, { children: [(0, jsx_runtime_1.jsx)("div", { children: room.name }), (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "text-lg flex" }, { children: [(user === null || user === void 0 ? void 0 : user.id) === room.authorId && ((0, jsx_runtime_1.jsx)(IconBtn_1.IconBtn, { onClick: () => openRoomEditor(room.id), "aria-label": "Room settings", Icon: ri_1.RiSettings4Fill })), (0, jsx_runtime_1.jsx)(IconBtn_1.IconBtn, { "aria-label": "Join room", onClick: () => (0, chat_1.joinRoom)(room.id)
                            .then(() => {
                            setChatSection("Chatroom");
                            setRoomId(room.id);
                        })
                            .catch((e) => setErr(`${e}`)), Icon: room.public ? tb_1.TbDoor : tb_1.TbDoorOff })] }))] })));
}
exports.default = Room;
