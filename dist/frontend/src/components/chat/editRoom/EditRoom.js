"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const ChatContext_1 = require("../../../context/ChatContext");
const UsersContext_1 = __importDefault(require("../../../context/UsersContext"));
const User_1 = __importDefault(require("../../User"));
const chat_1 = require("../../../services/chat");
const react_1 = require("react");
const MessengerError_1 = __importDefault(require("../MessengerError"));
const Toggler_1 = __importDefault(require("../../Toggler"));
function EditRoom({ room }) {
    const { editRoomId } = (0, ChatContext_1.useChat)();
    const { getUserData } = (0, UsersContext_1.default)();
    const [err, setErr] = (0, react_1.useState)("");
    return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "w-full h-full p-2" }, { children: [room ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("h1", Object.assign({ className: "font-bold text-2xl p-1 leading-5 text-center" }, { children: room.name })), (0, jsx_runtime_1.jsx)("div", Object.assign({ className: "mx-auto w-fit mb-4" }, { children: (0, jsx_runtime_1.jsx)(Toggler_1.default, { label: room.public ? "Public" : "Private", value: room.public, toggleValue: () => (0, chat_1.updateRoom)(room.id, { public: !room.public }).catch((e) => setErr(`${e}`)), "aria-label": "Toggle public" }) })), (0, jsx_runtime_1.jsx)("h2", Object.assign({ className: "text-center text-md font-bold" }, { children: "Members" })), (0, jsx_runtime_1.jsx)("div", Object.assign({ style: { maxHeight: "10pc" }, className: "flex overflow-y-auto flex-col gap-2" }, { children: room.members.map(({ id: memberUid }) => ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "flex pr-1 border border-stone-300 dark:border-stone-800 shadow p-1 rounded justify-between items-center" }, { children: [(0, jsx_runtime_1.jsx)("div", Object.assign({ className: "w-fit" }, { children: (0, jsx_runtime_1.jsx)(User_1.default, { uid: memberUid, user: getUserData(memberUid) }) })), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("button", Object.assign({ onClick: () => {
                                                (0, chat_1.kickUserFromRoom)(editRoomId, memberUid).catch((e) => setErr(`${e}`));
                                            }, "aria-label": "Kick", className: "mr-1" }, { children: "Kick" })), (0, jsx_runtime_1.jsx)("button", Object.assign({ onClick: () => {
                                                (0, chat_1.banUserFromRoom)(editRoomId, memberUid).catch((e) => setErr(`${e}`));
                                            }, "aria-label": "Ban", className: "mr-1" }, { children: "Ban" }))] })] }), memberUid))) })), room.banned.length > 0 && (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("h2", Object.assign({ className: "text-center text-md mt-2 font-bold" }, { children: "Banned users" })), (0, jsx_runtime_1.jsx)("div", Object.assign({ style: { maxHeight: "10pc" }, className: "flex flex-col gap-2 overflow-y-auto" }, { children: room.banned.map(({ id: bannedUid }) => ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "flex pr-1 border border-stone-300 dark:border-stone-800 shadow p-1 rounded justify-between items-center" }, { children: [(0, jsx_runtime_1.jsx)("div", Object.assign({ className: "w-fit" }, { children: (0, jsx_runtime_1.jsx)(User_1.default, { uid: bannedUid, user: getUserData(bannedUid) }) })), (0, jsx_runtime_1.jsx)("button", Object.assign({ onClick: () => {
                                                (0, chat_1.unbanUserFromRoom)(editRoomId, bannedUid).catch((e) => setErr(`${e}`));
                                            }, "aria-label": "Unban", className: "mr-1" }, { children: "Unban" }))] }), bannedUid))) }))] })] })) : ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: "Room does not exist" })), err && ((0, jsx_runtime_1.jsx)("div", Object.assign({ className: "rounded mt-2 overflow-hidden" }, { children: (0, jsx_runtime_1.jsx)(MessengerError_1.default, { err: err, closeError: () => setErr("") }) })))] })));
}
exports.default = EditRoom;
