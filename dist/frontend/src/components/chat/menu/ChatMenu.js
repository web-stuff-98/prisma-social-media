"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const ChatContext_1 = require("../../../context/ChatContext");
function Menu() {
    const { setChatSection } = (0, ChatContext_1.useChat)();
    const Button = ({ name, section, }) => {
        return ((0, jsx_runtime_1.jsx)("button", Object.assign({ "aria-label": name, onClick: () => setChatSection(section) }, { children: name })));
    };
    return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "w-full flex flex-col gap-2 p-2" }, { children: [(0, jsx_runtime_1.jsx)(Button, { name: "Join & create rooms", section: "Chatrooms" }), (0, jsx_runtime_1.jsx)(Button, { name: "Your conversations", section: "Conversations" }), (0, jsx_runtime_1.jsx)(Button, { name: "Your rooms", section: "UsersChatrooms" }), (0, jsx_runtime_1.jsx)(Button, { name: "Search users", section: "SearchUsers" })] })));
}
exports.default = Menu;
