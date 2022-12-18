"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUserdropdown = exports.UserdropdownProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const md_1 = require("react-icons/md");
const bs_1 = require("react-icons/bs");
const gi_1 = require("react-icons/gi");
const cg_1 = require("react-icons/cg");
const im_1 = require("react-icons/im");
const fc_1 = require("react-icons/fc");
const chat_1 = require("../services/chat");
const react_scrollbar_size_1 = __importDefault(require("react-scrollbar-size"));
const react_router_dom_1 = require("react-router-dom");
const UserdropdownContext = (0, react_1.createContext)({
    clickPos: { left: "0", top: "0" },
    openUserdropdown: () => { },
});
function UserdropdownProvider({ children }) {
    const { width: scrollbarWidth } = (0, react_scrollbar_size_1.default)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const containerRef = (0, react_1.useRef)(null);
    const [uid, setUid] = (0, react_1.useState)("");
    const [clickPos, setClickPos] = (0, react_1.useState)({ left: "0", top: "0" });
    const [cursorInside, setCursorInside] = (0, react_1.useState)(false);
    const [messageInput, setMessageInput] = (0, react_1.useState)("");
    const [roomInviteInput, setRoomInviteInput] = (0, react_1.useState)("");
    const [err, setErr] = (0, react_1.useState)("");
    const [section, setSection] = (0, react_1.useState)("Menu");
    const [openedInChatroom, setOpenedInChatroom] = (0, react_1.useState)("");
    const openUserdropdown = (uid, chatroomId) => {
        setUid(uid);
        setOpenedInChatroom(chatroomId || "");
    };
    const directMessageSubmit = (e) => {
        e.preventDefault();
        (0, chat_1.sendPrivateMessage)(messageInput, uid, false)
            .then(() => closeUserDropdown())
            .catch((e) => setErr(`${e}`));
    };
    const inviteSubmit = (e) => {
        e.preventDefault();
        (0, chat_1.sendInvite)(roomInviteInput, uid)
            .then(() => closeUserDropdown())
            .catch((e) => setErr(`${e}`));
    };
    const closeUserDropdown = () => {
        setUid("");
        setCursorInside(false);
        setSection("Menu");
        setErr("");
        setOpenedInChatroom("");
    };
    const adjust = (0, react_1.useCallback)((delay) => {
        if (delay)
            setTimeout(() => internal());
        else
            internal();
        function internal() {
            var _a;
            if (!containerRef.current)
                throw new Error("NO CONTAINER REF!!!");
            const leftClickPos = Number(clickPos.left.replace("px", ""));
            const containerRightEndPos = leftClickPos + ((_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.clientWidth);
            const padPx = 3 + scrollbarWidth;
            if (containerRightEndPos + padPx > window.innerWidth) {
                setClickPos({
                    left: `${leftClickPos -
                        Math.abs(window.innerWidth - containerRightEndPos - padPx)}px`,
                    top: clickPos.top,
                });
            }
        }
    }, [clickPos]);
    (0, react_1.useEffect)(() => {
        if (containerRef.current)
            adjust();
    }, [uid]);
    const clickedWhileOutside = (0, react_1.useCallback)((e) => {
        closeUserDropdown();
        setClickPos({
            left: `${e.clientX}px`,
            top: `${e.clientY}px`,
        });
    }, []);
    (0, react_1.useEffect)(() => {
        if (uid)
            adjust(true);
    }, [section]);
    (0, react_1.useEffect)(() => {
        if (!cursorInside)
            window.addEventListener("mousedown", clickedWhileOutside);
        else
            window.removeEventListener("mousedown", clickedWhileOutside);
        return () => window.removeEventListener("mousedown", clickedWhileOutside);
    }, [cursorInside]);
    return ((0, jsx_runtime_1.jsxs)(UserdropdownContext.Provider, Object.assign({ value: { clickPos, openUserdropdown } }, { children: [uid && ((0, jsx_runtime_1.jsx)("div", Object.assign({ ref: containerRef, onMouseEnter: () => setCursorInside(true), onMouseLeave: () => setCursorInside(false), "aria-label": "User dropdown", style: { left: clickPos.left, top: clickPos.top, zIndex: 100 }, className: "bg-foreground font-rubik text-white dark:bg-darkmodeForeground fixed border dark:border-stone-800 rounded shadow-md p-1" }, { children: err ? ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "text-rose-500 flex leading-5 items-center gap-1 text-xs font-bold pr-0.5 tracking-tight drop-shadow" }, { children: [(0, jsx_runtime_1.jsx)(md_1.MdError, { className: "text-xl", style: { minWidth: "1.5rem", minHeight: "1.5rem" } }), err] }))) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [section === "Menu" && ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "flex flex-col gap-1" }, { children: [(0, jsx_runtime_1.jsxs)("button", Object.assign({ "aria-label": "Message", className: "text-md rounded-sm px-0.5 pr-1 gap-2 font-bold flex items-center justify-between", onClick: () => setSection("DirectMessage") }, { children: [(0, jsx_runtime_1.jsx)(bs_1.BsFillChatRightFill, { className: "text-lg my-1 ml-0.5" }), "Chat"] })), (0, jsx_runtime_1.jsxs)("button", Object.assign({ "aria-label": "Invite", className: "text-md rounded-sm px-0.5 pr-1 gap-2 font-bold flex items-center justify-between", onClick: () => setSection("Invite") }, { children: [(0, jsx_runtime_1.jsx)(fc_1.FcInvite, { className: "text-lg my-1 ml-0.5" }), "Invite"] })), (0, jsx_runtime_1.jsxs)("button", Object.assign({ className: "text-md rounded-sm px-0.5 pr-1 gap-2 font-bold flex items-center justify-between", "aria-label": "Block", onClick: () => {
                                        navigate(`/profile/${uid}`);
                                        closeUserDropdown();
                                    } }, { children: [(0, jsx_runtime_1.jsx)(cg_1.CgProfile, { className: "text-lg my-1 ml-0.5" }), "Profile"] })), openedInChatroom && ((0, jsx_runtime_1.jsxs)("button", Object.assign({ className: "text-md rounded-sm px-0.5 pr-1 gap-2 font-bold flex items-center justify-between", "aria-label": "Invite", onClick: () => (0, chat_1.kickUserFromRoom)(openedInChatroom, uid)
                                        .catch((e) => setErr(`${e}`))
                                        .finally(() => setCursorInside(false)) }, { children: [(0, jsx_runtime_1.jsx)(gi_1.GiBootKick, { className: "text-lg my-1 ml-0.5" }), "Kick"] }))), openedInChatroom && ((0, jsx_runtime_1.jsxs)("button", Object.assign({ className: "text-md rounded-sm px-0.5 pr-1 gap-2 font-bold flex items-center justify-between", "aria-label": "Ban", onClick: () => (0, chat_1.banUserFromRoom)(openedInChatroom, uid)
                                        .catch((e) => {
                                        setErr(`${e}`);
                                    })
                                        .finally(() => setCursorInside(false)) }, { children: [(0, jsx_runtime_1.jsx)(im_1.ImBlocked, { className: "text-lg my-1 ml-0.5" }), "Ban"] })))] }))), section === "DirectMessage" && ((0, jsx_runtime_1.jsxs)("form", Object.assign({ className: "flex items-center", onSubmit: directMessageSubmit }, { children: [(0, jsx_runtime_1.jsx)("input", { autoFocus: true, value: messageInput, onChange: (e) => setMessageInput(e.target.value), placeholder: "Direct message...", required: true, type: "text", className: "text-black dark:text-white" }), (0, jsx_runtime_1.jsx)("button", Object.assign({ "aria-label": "Send direct message", className: "bg-transparent px-0 pl-1 text-xl" }, { children: (0, jsx_runtime_1.jsx)(md_1.MdSend, { className: "text-black dark:text-white" }) }))] }))), section === "Invite" && ((0, jsx_runtime_1.jsxs)("form", Object.assign({ className: "flex items-center", onSubmit: inviteSubmit }, { children: [(0, jsx_runtime_1.jsx)("input", { autoFocus: true, value: roomInviteInput, onChange: (e) => setRoomInviteInput(e.target.value), placeholder: "Room name...", required: true, type: "text", className: "text-black dark:text-white" }), (0, jsx_runtime_1.jsx)("button", Object.assign({ "aria-label": "Send direct message", className: "bg-transparent px-0 pl-1 text-xl" }, { children: (0, jsx_runtime_1.jsx)(fc_1.FcInvite, { className: "text-black dark:text-white" }) }))] })))] })) }))), children] })));
}
exports.UserdropdownProvider = UserdropdownProvider;
const useUserdropdown = () => (0, react_1.useContext)(UserdropdownContext);
exports.useUserdropdown = useUserdropdown;
