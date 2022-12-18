"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const md_1 = require("react-icons/md");
const ai_1 = require("react-icons/ai");
const react_1 = require("react");
const ri_1 = require("react-icons/ri");
function MessageForm({ handleMessageInput, handleFileInput, handleMessageSubmit, handleVidChatIconClicked = () => { }, file, messageInput, }) {
    const fileInputRef = (0, react_1.useRef)(null);
    return ((0, jsx_runtime_1.jsxs)("form", Object.assign({ onSubmit: handleMessageSubmit, className: "w-full border-t dark:border-zinc-800 h-10 py-1 flex items-center justify-between" }, { children: [(0, jsx_runtime_1.jsx)("button", Object.assign({ type: "button", className: "px-0 pl-1", "aria-label": "Select attachment", onClick: () => { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); } }, { children: (0, jsx_runtime_1.jsx)(ai_1.AiFillFileAdd, { className: `text-lg ${file ? "text-green-500" : ""}` }) })), (0, jsx_runtime_1.jsx)("input", { onChange: handleFileInput, id: "file", name: "file", ref: fileInputRef, type: "file", className: "hidden" }), (0, jsx_runtime_1.jsx)("input", { onChange: handleMessageInput, value: messageInput, id: "message", name: "message", type: "text", className: "grow mx-1 rounded-sm border dark:border-zinc-800 px-1" }), (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "flex my-auto items-center" }, { children: [(0, jsx_runtime_1.jsx)("button", Object.assign({ className: "px-1 pl-0", type: "submit", "aria-label": "Send message" }, { children: (0, jsx_runtime_1.jsx)(md_1.MdSend, { className: "text-2xl" }) })), (0, jsx_runtime_1.jsx)("button", Object.assign({ onClick: () => handleVidChatIconClicked(), className: "px-2", type: "button", "aria-label": "Open video chat" }, { children: (0, jsx_runtime_1.jsx)(ri_1.RiWebcamFill, { className: "text-2xl" }) }))] }))] })));
}
exports.default = MessageForm;
