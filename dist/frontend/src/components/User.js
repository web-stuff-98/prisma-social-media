"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const IconBtn_1 = require("./IconBtn");
const ri_1 = require("react-icons/ri");
const ai_1 = require("react-icons/ai");
const AuthContext_1 = require("../context/AuthContext");
const bs_1 = require("react-icons/bs");
const react_1 = require("react");
const UsersContext_1 = __importDefault(require("../context/UsersContext"));
const InterfaceContext_1 = require("../context/InterfaceContext");
const UserdropdownContext_1 = require("../context/UserdropdownContext");
const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
});
/**
 * date = Not required, renders a date under the username
 *
 * editDeleteIcons = if true, show edit/delete icons between pfp and text
 * you will need to assign the other variables for that too
 */
function User({ date, user, by, uid, editDeleteIcons, likeShareIcons, onEditClick, onDeleteClick, onLikeClick, onShareClick, liked, likes = 0, shared, shares = 0, isEditing, isDeleting, reverse, overridePfpOnClick, overridePfpBase64 = "", pfpCursor, isServer, chatroomId, micro, style = {}, fixDarkBackgroundContrast, }) {
    const { openUserdropdown } = (0, UserdropdownContext_1.useUserdropdown)();
    const { user: currentUser } = (0, AuthContext_1.useAuth)();
    const { cacheUserData } = (0, UsersContext_1.default)();
    const { state: iState } = (0, InterfaceContext_1.useInterface)();
    const { userEnteredView, userLeftView } = (0, UsersContext_1.default)();
    const containerRef = (0, react_1.useRef)(null);
    const observer = new IntersectionObserver(([entry]) => {
        if (!uid || uid === "undefined")
            return;
        if (entry.isIntersecting) {
            userEnteredView(uid);
            cacheUserData(uid);
        }
        else {
            userLeftView(uid);
        }
    });
    (0, react_1.useLayoutEffect)(() => {
        observer.observe(containerRef.current);
        return () => {
            if (uid)
                userLeftView(uid);
            observer.disconnect();
        };
        //putting the ref in the dependency array was the only way to get this working properly for some reason
    }, [containerRef.current]);
    const getDateString = (date) => dateFormatter.format(date);
    const renderDateTime = (dateString) => {
        return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ style: { lineHeight: "0.866" }, className: `flex tracking-tight mb-1 flex-col text-xs ${reverse ? "items-end" : "items-start"}` }, { children: [(0, jsx_runtime_1.jsx)("span", { children: dateString.split(", ")[0] }), (0, jsx_runtime_1.jsx)("span", { children: dateString.split(", ")[1] })] })));
    };
    return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ style: style, ref: containerRef, className: `${reverse ? "text-right" : "text-left"} flex ${reverse ? "flex-row-reverse" : ""} items-center justify-center` }, { children: [likeShareIcons && ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: `h-full drop-shadow ${reverse ? "pr-0.5 pl-1" : "pr-1 pl-0.5"} flex flex-col gap-1` }, { children: [(0, jsx_runtime_1.jsx)(IconBtn_1.IconBtn, Object.assign({ redirectToLogin: true, onClick: onLikeClick, Icon: liked ? ai_1.AiFillLike : ai_1.AiOutlineLike, "aria-label": liked ? "Unlike" : "Like", color: fixDarkBackgroundContrast
                            ? liked
                                ? "text-stone-200 dark:text-stone-200"
                                : "text-stone-400 dark:text-stone-400"
                            : liked
                                ? "text-stone-500 dark:text-stone-400"
                                : "text-stone-400 dark:text-stone-400" }, { children: likes > 0 && ((0, jsx_runtime_1.jsx)("div", Object.assign({ style: {
                                zIndex: "96",
                                top: "-25%",
                                left: reverse ? "27.5%" : "-27.5%",
                            }, className: `absolute text-md ${fixDarkBackgroundContrast
                                ? "text-green-400"
                                : "text-stone-900 dark:text-green-500"} font-extrabold drop-shadow leading-3 tracking-tighter` }, { children: likes }))) })), (0, jsx_runtime_1.jsx)(IconBtn_1.IconBtn, Object.assign({ redirectToLogin: true, onClick: onShareClick, Icon: shared ? bs_1.BsShareFill : bs_1.BsShare, "aria-label": shared ? "Unshare" : "Share", color: fixDarkBackgroundContrast
                            ? shared
                                ? "text-stone-200 dark:text-stone-200"
                                : "text-stone-400 dark:text-stone-400"
                            : shared
                                ? "text-stone-500 dark:text-stone-400"
                                : "text-stone-400 dark:text-stone-400" }, { children: shares > 0 && ((0, jsx_runtime_1.jsx)("div", Object.assign({ style: {
                                zIndex: "96",
                                top: "-25%",
                                left: reverse ? "27.5%" : "-27.5%",
                            }, className: `absolute text-md ${fixDarkBackgroundContrast
                                ? "text-green-400"
                                : "text-stone-900 dark:text-green-500"} font-extrabold drop-shadow leading-3 tracking-tighter` }, { children: shares }))) }))] }))), (0, jsx_runtime_1.jsx)("div", Object.assign({ style: Object.assign(Object.assign({}, (overridePfpBase64
                    ? {
                        backgroundImage: `url(${overridePfpBase64})`,
                    }
                    : {
                        backgroundImage: `url(${isServer
                            ? iState.darkMode
                                ? "/pfp_server_dark.png"
                                : "/pfp_server.png"
                            : (user === null || user === void 0 ? void 0 : user.pfp) ||
                                (iState.darkMode ? "/pfp_dark.png" : "/pfp.png")})`,
                    })), { backgroundPosition: "center", backgroundSize: "cover" }), onClick: () => {
                    if (overridePfpOnClick) {
                        return overridePfpOnClick();
                    }
                    if (currentUser && uid)
                        if ((user === null || user === void 0 ? void 0 : user.id) !== (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id))
                            openUserdropdown(uid, chatroomId);
                }, className: `${micro ? "w-5 h-5" : date && !isServer ? "w-9 h-9" : "w-8 h-8"} border ${fixDarkBackgroundContrast ? "border-white" : "border-black"} dark:border-white relative ${((currentUser && (user === null || user === void 0 ? void 0 : user.id) !== (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id) && uid) || pfpCursor) &&
                    "cursor-pointer"} ${micro ? "rounded" : "rounded-full"} ${!isServer && "shadow-md"}` }, { children: (user === null || user === void 0 ? void 0 : user.online) && ((0, jsx_runtime_1.jsx)("span", { style: {
                        width: "0.5rem",
                        height: "0.5rem",
                        bottom: micro ? "-6px" : 0,
                        right: micro ? "-6px" : 0,
                    }, className: "absolute z-30 rounded-full shadow border border-black bg-green-500" })) })), editDeleteIcons && ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: `h-full drop-shadow ${reverse ? "pl-0.5 pr-1" : "pl-1 pr-0.5"} flex flex-col gap-1` }, { children: [(0, jsx_runtime_1.jsx)(IconBtn_1.IconBtn, { onClick: () => {
                            if (onEditClick)
                                onEditClick();
                        }, isActive: isEditing, Icon: ri_1.RiEditBoxFill, "aria-label": isEditing ? "Cancel Edit" : "Edit" }), (0, jsx_runtime_1.jsx)(IconBtn_1.IconBtn, { disabled: isDeleting, onClick: onDeleteClick, Icon: ri_1.RiDeleteBin4Fill, "aria-label": "Delete", color: "text-rose-600" })] }))), !micro && ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "leading-3 mt-0.5 px-1" }, { children: [user && ((0, jsx_runtime_1.jsxs)("h1", Object.assign({ className: `font-bold ${date ? "text-sm" : "text-xs"} leading-4 tracking-tight whitespace-nowrap` }, { children: [by && "By ", user === null || user === void 0 ? void 0 : user.name] }))), date && renderDateTime(getDateString(date))] })))] })));
}
exports.default = User;
