"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
const AuthContext_1 = require("../../context/AuthContext");
const InterfaceContext_1 = require("../../context/InterfaceContext");
const react_1 = require("react");
const gi_1 = require("react-icons/gi");
const im_1 = require("react-icons/im");
const io5_1 = require("react-icons/io5");
const IconBtn_1 = require("../IconBtn");
const FilterContext_1 = require("../../context/FilterContext");
const PostsContext_1 = require("../../context/PostsContext");
const Dropdown_1 = __importDefault(require("../Dropdown"));
function Nav() {
    const containerRef = (0, react_1.useRef)(null);
    const { logout, user } = (0, AuthContext_1.useAuth)();
    const { state: iState, dispatch: iDispatch } = (0, InterfaceContext_1.useInterface)();
    const { searchTerm, setSearchTerm, sortOrderIndex, sortModeIndex, setSortMode, setSortOrder, } = (0, FilterContext_1.useFilter)();
    const { status } = (0, PostsContext_1.usePosts)();
    const renderBlogControls = () => {
        return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "flex dark items-center gap-1" }, { children: [(0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "flex" }, { children: [(0, jsx_runtime_1.jsx)("div", Object.assign({ style: { width: "3rem" } }, { children: (0, jsx_runtime_1.jsx)(Dropdown_1.default, { items: FilterContext_1.SortOrderOptions, index: sortOrderIndex, setIndex: (to) => setSortOrder(to), noRightBorderRadius: true, noRightBorder: true }) })), (0, jsx_runtime_1.jsx)(Dropdown_1.default, { items: FilterContext_1.SortModeOptions, index: sortModeIndex, setIndex: (to) => setSortMode(to), noLeftBorderRadius: true, noLeftBorder: true })] })), (0, jsx_runtime_1.jsx)("input", { value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), type: "text", style: { width: "7.5rem" }, className: "px-1" }), (0, jsx_runtime_1.jsx)(IconBtn_1.IconBtn, { "aria-label": "Submit search query", Icon: status === "pending-search" ? im_1.ImSpinner8 : io5_1.IoSearch, color: `${status === "pending-search" ? "animate-spin" : ""} text-xl text-white` })] })));
    };
    return ((0, jsx_runtime_1.jsx)("nav", Object.assign({ ref: containerRef, style: iState.breakPoint === "sm"
            ? Object.assign({ transition: "height 100ms ease" }, (iState.mobileMenuOpen
                ? {
                    flexDirection: "column",
                    height: "14pc",
                }
                : {})) : {}, className: `w-full bg-neutral-900 dark:bg-zinc-900 border-b border-t border-zinc-800 dark:border-stone-800 min-h-nav` }, { children: (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: `mx-auto h-full container ${iState.breakPoint === "sm"
                    ? `flex flex-col text-left py-1 items-start `
                    : "flex items-center my-auto"} justify-between px-1.5` }, { children: [(iState.breakPoint !== "sm" || iState.mobileMenuOpen) && ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: `${iState.breakPoint === "sm"
                            ? "flex flex-col gap-1 pt-2"
                            : "flex gap-4 tracking-tighter"} text-white` }, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Link, Object.assign({ to: "/", "aria-label": "Home", className: "text-md font-bold" }, { children: "Home" })), (0, jsx_runtime_1.jsx)(react_router_dom_1.Link, Object.assign({ to: "/blog/1", "aria-label": "Blog", className: "text-md font-bold" }, { children: "Blog" })), user && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Link, Object.assign({ to: "/settings", "aria-label": "Settings", className: "text-md font-bold" }, { children: "Settings" })), (0, jsx_runtime_1.jsx)(react_router_dom_1.Link, Object.assign({ to: `/profile/${user.id}`, "aria-label": "Profile", className: "text-md font-bold" }, { children: "Profile" }))] })), !user && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Link, Object.assign({ to: "/login", "aria-label": "Login", className: "text-md font-bold" }, { children: "Login" })), (0, jsx_runtime_1.jsx)(react_router_dom_1.Link, Object.assign({ to: "/register", "aria-label": "Register", className: "text-md font-bold" }, { children: "Register" }))] })), user && ((0, jsx_runtime_1.jsx)(react_router_dom_1.Link, Object.assign({ to: "/editor", "aria-label": "Editor", className: "text-md font-bold" }, { children: "Editor" }))), user && ((0, jsx_runtime_1.jsx)("button", Object.assign({ className: `text-md ${iState.breakPoint === "sm" && iState.mobileMenuOpen
                                    ? "text-left"
                                    : "text-center"} font-bold px-0 bg-transparent`, onClick: () => logout() }, { children: "Logout" })))] }))), iState.breakPoint === "sm" && ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: `flex ${iState.mobileMenuOpen ? "" : "my-auto"} w-full` }, { children: [(0, jsx_runtime_1.jsx)("button", Object.assign({ onClick: () => iDispatch({ mobileMenuOpen: !iState.mobileMenuOpen }), "aria-label": "Toggle navigation menu", className: "bg-transparent px-0 w-full flex items-center justify-start" }, { children: (0, jsx_runtime_1.jsx)(gi_1.GiHamburgerMenu, { className: "text-white text-2xl my-auto h-full" }) })), iState.breakPoint === "sm" && renderBlogControls()] }))), iState.breakPoint !== "sm" && renderBlogControls()] })) }) })));
}
exports.default = Nav;
