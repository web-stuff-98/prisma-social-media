"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ri_1 = require("react-icons/ri");
const md_1 = require("react-icons/md");
const react_player_1 = __importDefault(require("react-player"));
const UsersContext_1 = __importDefault(require("../../../context/UsersContext"));
const User_1 = __importDefault(require("../../User"));
const ProgressBar_1 = __importDefault(require("../../ProgressBar"));
const im_1 = require("react-icons/im");
const chat_1 = require("../../../services/chat");
const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
});
function Message({ otherUser = false, message, id, senderId, hasAttachment = false, attachmentType, attachmentKey, attachmentError, attachmentProgress, attachmentPending, createdAt, updatedAt, roomId, isServerMessage, isInvite, }) {
    const { getUserData } = (0, UsersContext_1.default)();
    const [isEditing, setIsEditing] = (0, react_1.useState)(false);
    const [cursorInsideInput, setCursorInsideInput] = (0, react_1.useState)(false);
    const [messageEditInput, setMessageEditInput] = (0, react_1.useState)("");
    (0, react_1.useEffect)(() => {
        const clicked = () => {
            if (!cursorInsideInput) {
                setIsEditing(false);
            }
        };
        document.addEventListener("mousedown", clicked);
        return () => {
            document.removeEventListener("mousedown", clicked);
        };
    }, [cursorInsideInput]);
    const updateMessage = () => {
        if (messageEditInput !== message)
            roomId
                ? (0, chat_1.updateRoomMessage)(id, messageEditInput)
                : (0, chat_1.updatePrivateMessage)(id, messageEditInput);
        setIsEditing(false);
    };
    const getDateString = (date) => dateFormatter.format(date);
    const renderEditedAtTimeString = (dateString) => ((0, jsx_runtime_1.jsxs)("b", Object.assign({ style: { filter: "opacity(0.333)" }, className: "pl-2" }, { children: ["Edited ", dateString] })));
    return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ "aria-label": otherUser ? "Other users message" : "Your message", className: `p-0.5 flex ${otherUser ? "flex-row-reverse text-right" : ""} items-start` }, { children: [(0, jsx_runtime_1.jsx)("div", Object.assign({ className: "p-1" }, { children: (0, jsx_runtime_1.jsx)(User_1.default, { reverse: isServerMessage || otherUser, date: new Date(createdAt), uid: senderId, user: isServerMessage ? undefined : getUserData(senderId), isServer: isServerMessage, chatroomId: roomId }) })), (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "gap-1 grow flex flex-col my-auto px-1" }, { children: [isEditing ? ((0, jsx_runtime_1.jsxs)("div", Object.assign({ onMouseEnter: () => setCursorInsideInput(true), onMouseLeave: () => setCursorInsideInput(false), className: "flex items-center justify-center" }, { children: [(0, jsx_runtime_1.jsx)("textarea", { className: "grow", "aria-label": "Edit comment input", value: messageEditInput, onChange: (e) => setMessageEditInput(e.target.value) }), (0, jsx_runtime_1.jsx)("button", Object.assign({ className: "px-0 pl-2 bg-transparent", "aria-label": "Update message", onClick: () => updateMessage() }, { children: (0, jsx_runtime_1.jsx)(md_1.MdScheduleSend, { className: "text-lg drop-shadow" }) }))] }))) : ((0, jsx_runtime_1.jsxs)("p", Object.assign({ className: `leading-3 text-xs my-auto h-full` }, { children: [isInvite
                                ? `Invitation to ${message.split("INVITATION ")[1]}`
                                : (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [message, "              ", updatedAt !== createdAt &&
                                            renderEditedAtTimeString(getDateString(new Date(updatedAt)))] }), isInvite && ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "gap-0.5 flex w-full justify-end drop-shadow-md my-0.5" }, { children: [(0, jsx_runtime_1.jsx)("button", Object.assign({ onClick: () => (0, chat_1.acceptInvite)(senderId, message.split("INVITATION ")[1]), "aria-label": "Accept invitation", className: "py-0.5 px-0.5 drop-shadow rounded-sm" }, { children: "Accept \u2705" })), (0, jsx_runtime_1.jsx)("button", Object.assign({ onClick: () => (0, chat_1.declineInvite)(senderId, message.split("INVITATION ")[1]), "aria-label": "Decline invitation", className: "py-0.5 px-0.5 drop-shadow rounded-sm" }, { children: "Decline \u274C" }))] })))] }))), hasAttachment && attachmentType === "Image" && ((0, jsx_runtime_1.jsx)("img", { src: `https://d2gt89ey9qb5n6.cloudfront.net/${attachmentKey}`, className: "drop-shadow rounded-md mx-auto w-fit h-fit" })), hasAttachment && attachmentType === "Video" && ((0, jsx_runtime_1.jsx)("div", Object.assign({ className: `overflow-hidden drop-shadow rounded-md grow` }, { children: (0, jsx_runtime_1.jsx)(react_player_1.default, { controls: true, width: "100%", height: "auto", url: `https://d2gt89ey9qb5n6.cloudfront.net/${attachmentKey}` }) }))), typeof attachmentProgress === "number" &&
                        attachmentPending &&
                        !attachmentError && ((0, jsx_runtime_1.jsx)("div", Object.assign({ className: "px-1" }, { children: (0, jsx_runtime_1.jsx)(ProgressBar_1.default, { percent: attachmentProgress * 100 }) }))), attachmentError && ((0, jsx_runtime_1.jsxs)("div", Object.assign({ style: { filter: "opacity(0.333)" }, className: `text-rose-600 font-bold tracking-tight text-xs flex ${otherUser ? "flex-row-reverse justify-end" : "justify-start"} items-center gap-0.5` }, { children: [(0, jsx_runtime_1.jsx)(md_1.MdError, { className: "text-2xl" }), "Error uploading attachment"] }))), hasAttachment && attachmentType === "File" && ((0, jsx_runtime_1.jsxs)("a", Object.assign({ "aria-label": "Download attachment", download: true, href: `https://d2gt89ey9qb5n6.cloudfront.net/${attachmentKey}`, className: `px-0 ${otherUser ? "pr-1" : "pl-1"} bg-transparent flex ${otherUser ? "flex-row-reverse" : ""} text-xs items-center gap-1 text-gray-400 hover:text-black dark:hover:text-white` }, { children: [(0, jsx_runtime_1.jsx)(im_1.ImDownload3, { className: "text-lg" }), " download attachment"] })))] })), !otherUser && ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "flex flex-col items-center justify-center gap-2 p-0.5 my-auto" }, { children: [!isEditing && !isInvite && ((0, jsx_runtime_1.jsx)("button", Object.assign({ onClick: () => {
                            setIsEditing(true);
                            setMessageEditInput(message);
                        }, className: "px-0 bg-transparent", "aria-label": "Edit message", type: "button" }, { children: (0, jsx_runtime_1.jsx)(ri_1.RiEditBoxFill, { className: "text-sm drop-shadow" }) }))), !isEditing && ((0, jsx_runtime_1.jsx)("button", Object.assign({ onClick: () => roomId ? (0, chat_1.deleteRoomMessage)(id) : (0, chat_1.deletePrivateMessage)(id), className: "px-0 bg-transparent", "aria-label": isEditing ? "Submit change" : "Delete message", type: "button" }, { children: (0, jsx_runtime_1.jsx)(ri_1.RiDeleteBin4Fill, { className: "text-sm text-rose-600 drop-shadow" }) })))] })))] })));
}
exports.default = Message;
