"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const md_1 = require("react-icons/md");
const ChatContext_1 = require("../../context/ChatContext");
function ChatTopIcons() {
    const { closeChat, setChatSection, chatSection, topText } = (0, ChatContext_1.useChat)();
    return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ style: { top: "0" }, className: "w-full bg-zinc-800 dark:bg-zinc-900 border-b border-stone-800 text-white pl-1 text-xs dark:border-stone-800 h-6 flex justify-between items-center absolute" }, { children: [topText, (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "grow flex justify-end" }, { children: [(0, jsx_runtime_1.jsx)("button", Object.assign({ disabled: chatSection === "Menu", style: chatSection === "Menu" ? { filter: "opacity(0.166)" } : {}, className: "px-0 bg-transparent", "aria-label": "Close chat" }, { children: (0, jsx_runtime_1.jsx)(md_1.MdMenu, { onClick: () => setChatSection("Menu"), className: "text-white text-xl" }) })), (0, jsx_runtime_1.jsx)("button", Object.assign({ className: "px-0 bg-transparent", "aria-label": "Close chat" }, { children: (0, jsx_runtime_1.jsx)(md_1.MdClose, { onClick: () => closeChat(), className: "text-white text-xl" }) }))] }))] })));
}
exports.default = ChatTopIcons;
