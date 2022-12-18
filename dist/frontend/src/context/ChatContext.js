"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChat = exports.ChatProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const bs_1 = require("react-icons/bs");
const ChatTopTray_1 = __importDefault(require("../components/chat/ChatTopTray"));
const Conversation_1 = __importDefault(require("../components/chat/conversation/Conversation"));
const ConversationsSection_1 = __importDefault(require("../components/chat/conversations/ConversationsSection"));
const ChatMenu_1 = __importDefault(require("../components/chat/menu/ChatMenu"));
const SearchUsers_1 = __importDefault(require("../components/chat/searchUsers/SearchUsers"));
const UsersChatrooms_1 = __importDefault(require("../components/chat/rooms/usersChatrooms/UsersChatrooms"));
const react_scrollbar_size_1 = __importDefault(require("react-scrollbar-size"));
const Rooms_1 = __importDefault(require("../components/chat/rooms/Rooms"));
const Room_1 = __importDefault(require("../components/chat/room/Room"));
const useCustomArrayAsync_1 = __importDefault(require("../hooks/useCustomArrayAsync"));
const chat_1 = require("../services/chat");
const EditRoom_1 = __importDefault(require("../components/chat/editRoom/EditRoom"));
const AuthContext_1 = require("./AuthContext");
const react_router_dom_1 = require("react-router-dom");
const ChatProvider = ({ children }) => {
    const { width: scrollBarWidth } = (0, react_scrollbar_size_1.default)();
    const { user } = (0, AuthContext_1.useAuth)();
    const location = (0, react_router_dom_1.useLocation)();
    const [topText, setTopText] = (0, react_1.useState)("");
    const [chatOpen, setchatOpen] = (0, react_1.useState)(false);
    const [chatSection, setChatSectionState] = (0, react_1.useState)("Menu");
    const setChatSection = (to) => {
        setChatSectionState(to);
        if (to === "Menu")
            setTopText("");
    };
    const [conversationWith, setConversationWith] = (0, react_1.useState)("");
    const [roomId, setRoomId] = (0, react_1.useState)("");
    const openChat = () => {
        setChatSection("Menu");
        setchatOpen(true);
    };
    const closeChat = () => {
        setchatOpen(false);
        setChatSection("Menu");
    };
    const openConversation = (uid) => {
        setConversationWith(uid);
        setchatOpen(true);
        setChatSection("Conversation");
    };
    const [editRoomId, setEditRoomId] = (0, react_1.useState)("");
    const openRoomEditor = (roomId) => {
        setEditRoomId(roomId);
        setChatSection("EditRoom");
    };
    const { error: roomsError, status: roomsStatus, value: rooms, execute: getRoomsData, } = (0, useCustomArrayAsync_1.default)(chat_1.getRooms, [], "room_updated", "room_deleted", "room_created", undefined, undefined, true);
    (0, react_1.useEffect)(() => {
        if (user)
            getRoomsData();
    }, [user]);
    const getRoom = (0, react_1.useCallback)((id) => rooms.find((r) => r.id === id), [rooms]);
    const userStream = (0, react_1.useRef)(undefined);
    const [selfMuted, setSelfMuted] = (0, react_1.useState)(false);
    const initVideo = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const stream = yield navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });
            userStream.current = stream;
        }
        catch (e) {
            if (`${e}`.includes("NotFoundError"))
                throw new Error("Camera could not be found");
            else
                throw new Error(`${e}`);
        }
    });
    const toggleMuteSelf = () => {
        if (!userStream.current)
            return;
        const audioTracks = userStream.current.getAudioTracks();
        if (audioTracks) {
            audioTracks.forEach((track) => {
                setSelfMuted(!track.enabled);
                track.enabled = !track.enabled;
            });
        }
    };
    return ((0, jsx_runtime_1.jsxs)(ChatContext.Provider, Object.assign({ value: {
            chatOpen,
            openChat,
            closeChat,
            openConversation,
            setChatSection,
            chatSection,
            topText,
            setTopText,
            rooms,
            roomsError,
            roomsStatus,
            roomId,
            setRoomId,
            openRoomEditor,
            editRoomId,
            getRoom,
            toggleMuteSelf,
            initVideo,
            selfMuted,
            userStream,
        } }, { children: [user && (0, jsx_runtime_1.jsxs)("div", Object.assign({ style: Object.assign(Object.assign(Object.assign(Object.assign({}, chatModalStyle), (chatOpen ? chatOpenStyle : chatClosedStyle)), (chatSection === "Menu"
                    ? { width: "fit-content", height: "fit-content" }
                    : {})), { right: `calc(${scrollBarWidth}px + 0.125rem)`, bottom: `calc(${scrollBarWidth}px + 0.125rem + ${location.pathname.includes("/blog") ? "4.0rem" : "0rem"})` }), className: `mx-auto font-rubik dark:text-white relative ${chatOpen
                    ? "bg-foreground dark:bg-darkmodeForeground border border-zinc-300 dark:border-stone-800"
                    : "bg-transparent"} rounded p-3 ${chatOpen ? "shadow-md" : ""}` }, { children: [chatOpen ? ((0, jsx_runtime_1.jsx)(ChatTopTray_1.default, {})) : ((0, jsx_runtime_1.jsx)("button", Object.assign({ className: "px-0 text-3xl bg-transparent", "aria-label": "Open chat" }, { children: (0, jsx_runtime_1.jsx)(bs_1.BsFillChatRightFill, { onClick: () => openChat(), className: "text-3xl cursor-pointer text-black dark:text-white drop-shadow" }) }))), chatOpen && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [chatSection === "Menu" && (0, jsx_runtime_1.jsx)(ChatMenu_1.default, {}), chatSection === "SearchUsers" && (0, jsx_runtime_1.jsx)(SearchUsers_1.default, {}), chatSection === "UsersChatrooms" && (0, jsx_runtime_1.jsx)(UsersChatrooms_1.default, {}), chatSection === "Conversation" && ((0, jsx_runtime_1.jsx)(Conversation_1.default, { conversationWith: conversationWith })), chatSection === "Conversations" && (0, jsx_runtime_1.jsx)(ConversationsSection_1.default, {}), chatSection === "Chatrooms" && (0, jsx_runtime_1.jsx)(Rooms_1.default, {}), chatSection === "Chatroom" && (0, jsx_runtime_1.jsx)(Room_1.default, { roomId: roomId }), chatSection === "EditRoom" && ((0, jsx_runtime_1.jsx)(EditRoom_1.default, { room: getRoom(editRoomId) }))] }))] })), children] })));
};
exports.ChatProvider = ChatProvider;
const ChatContext = (0, react_1.createContext)({
    chatOpen: false,
    openChat: () => { },
    closeChat: () => { },
    openConversation: () => { },
    setChatSection: () => { },
    chatSection: "Menu",
    topText: "",
    setTopText: () => { },
    roomsStatus: "idle",
    roomsError: null,
    rooms: [],
    roomId: "",
    setRoomId: () => { },
    openRoomEditor: () => { },
    editRoomId: "",
    getRoom: () => undefined,
    userStream: undefined,
    toggleMuteSelf: () => { },
    initVideo: () => __awaiter(void 0, void 0, void 0, function* () { }),
    selfMuted: false,
});
const useChat = () => (0, react_1.useContext)(ChatContext);
exports.useChat = useChat;
const chatModalStyle = {
    zIndex: "99",
    position: "absolute",
    overflow: "hidden",
};
const chatOpenStyle = {
    width: "min(22.5pc, calc(100vw - 1rem))",
    height: "min(fit-content, 30pc, calc(100vh - 1rem - 70rem))",
    padding: "0",
    paddingTop: "1.5rem",
};
const chatClosedStyle = {
    width: "min(22.5pc, fit-content)",
    height: "min(30pc, fit-content)",
    bottom: "0",
    right: "0",
};
