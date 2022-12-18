"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const Layout_1 = require("../components/layout/Layout");
const PostCard_1 = __importDefault(require("../components/postList/PostCard"));
const InterfaceContext_1 = require("../context/InterfaceContext");
const PostsContext_1 = require("../context/PostsContext");
const FilterContext_1 = require("../context/FilterContext");
const Tag_1 = __importDefault(require("../components/postList/Tag"));
const im_1 = require("react-icons/im");
const react_scrollbar_size_1 = __importDefault(require("react-scrollbar-size"));
function Blog() {
    const { pagePosts, getPostData, status } = (0, PostsContext_1.usePosts)();
    const { searchTags } = (0, FilterContext_1.useFilter)();
    const { state: iState } = (0, InterfaceContext_1.useInterface)();
    const scrollToTop = (0, Layout_1.useScrollToTop)();
    const postsContainerRef = (0, react_1.useRef)(null);
    const { width: scrollWidth } = (0, react_scrollbar_size_1.default)();
    (0, react_1.useEffect)(() => {
        scrollToTop();
    }, [pagePosts]);
    return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: `w-full h-full relative flex gap-3 ${iState.breakPoint === "sm" ? "p-1" : "p-3"}` }, { children: [
            /* Selected tags container */
            searchTags.length > 0 && ((0, jsx_runtime_1.jsx)("span", Object.assign({ style: {
                    position: "fixed",
                    top: "6.5rem",
                    left: "0",
                    background: iState.darkMode ? "rgba(0,0,0,0.333)" : "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(2px)",
                    borderBottom: "1px solid rgba(255,255,255,0.166)",
                    zIndex: "97",
                    width: `calc(100vw - ${scrollWidth}px)`
                }, className: "w-full flex p-2 items-center justify-center h-fit shadow-xl bg-gray-500" }, { children: (0, jsx_runtime_1.jsx)("div", Object.assign({ style: { filter: "drop-shadow(0px 1.5px 1px rgba(0,0,0,0.5))" }, className: "flex flex-wrap justify-center py-1 gap-0.5" }, { children: searchTags.map((tag) => ((0, jsx_runtime_1.jsx)(Tag_1.default, { isSearchTag: true, tag: tag }, tag))) })) }))), (0, jsx_runtime_1.jsxs)("div", Object.assign({ ref: postsContainerRef, className: "flex flex-col grow gap-3" }, { children: [status === "pending" && ((0, jsx_runtime_1.jsx)(im_1.ImSpinner8, { className: "text-4xl mx-auto animate-spin" })), pagePosts &&
                        status !== "pending" &&
                        pagePosts.length > 0 &&
                        pagePosts.map((slug, i) => ((0, jsx_runtime_1.jsx)(PostCard_1.default, { reverse: Boolean(i % 2), post: Object.assign({ slug }, getPostData(slug)) }, slug))), (0, jsx_runtime_1.jsx)("span", { style: { minHeight: "5rem" } })] }))] })));
}
exports.default = Blog;
