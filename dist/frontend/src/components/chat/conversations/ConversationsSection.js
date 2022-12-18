"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const IconBtn_1 = require("../../IconBtn");
const User_1 = __importDefault(require("../../User"));
const react_1 = require("react");
const ri_1 = require("react-icons/ri");
const chat_1 = require("../../../services/chat");
const ChatContext_1 = require("../../../context/ChatContext");
const UsersContext_1 = __importDefault(require("../../../context/UsersContext"));
function ConversationsSection() {
    const { openConversation } = (0, ChatContext_1.useChat)();
    const { getUserData } = (0, UsersContext_1.default)();
    const [users, setUsers] = (0, react_1.useState)([]);
    const [resMsg, setResMsg] = (0, react_1.useState)({ msg: "", err: false, pen: false });
    (0, react_1.useEffect)(() => {
        setResMsg({ msg: "", err: false, pen: true });
        (0, chat_1.getConversations)()
            .then((users) => {
            setUsers(users);
            setResMsg({ msg: "", err: false, pen: false });
        })
            .catch((e) => {
            setResMsg({ msg: `${e}`, err: true, pen: false });
        });
    }, []);
    return ((0, jsx_runtime_1.jsx)("div", Object.assign({ className: "flex flex-col overflow-y-auto max-h-full w-full" }, { children: users.length > 0 ? ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: users.map((user) => ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "p-2 w-full flex justify-between items-center" }, { children: [(0, jsx_runtime_1.jsx)(User_1.default, { uid: user.id, overridePfpOnClick: () => {
                            openConversation(user.id);
                        }, user: getUserData(user.id) }), (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "flex flex-col gap-2 cursor-pointer" }, { children: [(0, jsx_runtime_1.jsx)(IconBtn_1.IconBtn, { onClick: () => (0, chat_1.deleteConversation)(user.id), "aria-label": "Delete conversation with user", color: "text-rose-600", Icon: ri_1.RiDeleteBin4Fill }), (0, jsx_runtime_1.jsx)(IconBtn_1.IconBtn, { onClick: () => openConversation(user.id), "aria-label": "Conversation with user", Icon: ri_1.RiMessage2Fill })] }))] }), user.id))) })) : ((0, jsx_runtime_1.jsx)("div", Object.assign({ className: "text-center flex items-center text-xs w-full text-center h-full my-auto p-3" }, { children: "You have neither received nor sent any messages. Click on another users profile to send a message. You can find other users on the blog, or you can search for another user by going back and using the search user section. Click on the three bars icon above to head back to the main chat menu." }))) })));
}
exports.default = ConversationsSection;
