"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
const FilterContext_1 = require("../../context/FilterContext");
const PostsContext_1 = require("../../context/PostsContext");
const UsersContext_1 = __importDefault(require("../../context/UsersContext"));
const User_1 = __importDefault(require("../User"));
const ri_1 = require("react-icons/ri");
const IconBtn_1 = require("../IconBtn");
const AuthContext_1 = require("../../context/AuthContext");
const react_1 = require("react");
const ModalContext_1 = require("../../context/ModalContext");
const posts_1 = require("../../services/posts");
const InterfaceContext_1 = require("../../context/InterfaceContext");
const Tag_1 = __importDefault(require("./Tag"));
function PostCard({ post, reverse = false, }) {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { getUserData } = (0, UsersContext_1.default)();
    const { likePost, sharePost, postEnteredView, postLeftView } = (0, PostsContext_1.usePosts)();
    const { openModal } = (0, ModalContext_1.useModal)();
    const { state: iState } = (0, InterfaceContext_1.useInterface)();
    const { user } = (0, AuthContext_1.useAuth)();
    const { searchTags, autoAddRemoveSearchTag } = (0, FilterContext_1.useFilter)();
    const containerRef = (0, react_1.useRef)(null);
    const [visible, setVisible] = (0, react_1.useState)(false);
    const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
            setVisible(true);
        }
        else {
            setVisible(false);
        }
    });
    (0, react_1.useLayoutEffect)(() => {
        if (post.slug)
            postEnteredView(post.slug);
        observer.observe(containerRef.current);
        return () => {
            if (post.slug)
                postLeftView(post.slug);
            observer.disconnect();
        };
        //putting the ref in the dependency array was the only way to get this working properly for some reason
    }, [containerRef.current]);
    return ((0, jsx_runtime_1.jsx)("article", Object.assign({ ref: containerRef, className: `p-2 md:pl-2 bg-foreground dark:bg-darkmodeForeground shadow rounded border-stone-200 border dark:border-stone-800 text-center md:h-postHeight gap-1 sm:flex-col md:flex ${reverse ? "md:flex-row-reverse" : "md:flex-row"} h-full w-full justify-evenly` }, { children: (post === null || post === void 0 ? void 0 : post.author) ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", Object.assign({ style: Object.assign({ backgroundImage: `url(${post.blur})`, backgroundSize: "cover", backgroundPosition: "center" }, (iState.breakPoint === "sm" ? { height: "256px" } : {})), className: "relative border border-zinc-700 shadow-md sm:w-full sm:h-28 md:w-64 md:min-w-postWidth md:max-w-postWidth md:h-postImageHeight bg-gray-200 shadow rounded overflow-hidden shadow" }, { children: [visible && ((0, jsx_runtime_1.jsx)(react_router_dom_1.Link, Object.assign({ to: `/posts/${post.slug}` }, { children: (0, jsx_runtime_1.jsx)("img", { style: {
                                    background: "transparent",
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    objectPosition: "center",
                                }, className: "cursor-pointer", src: `https://d2gt89ey9qb5n6.cloudfront.net/thumb.${post.imageKey}` }) }))), user && post.author.id === user.id && ((0, jsx_runtime_1.jsxs)("div", Object.assign({ style: {
                                bottom: "0",
                                left: "0",
                                background: "rgba(0,0,0,0.333)",
                                backdropFilter: "blur(2px)",
                            }, className: "w-full flex justify-center gap-2 p-1 drop-shadow-lg absolute" }, { children: [(0, jsx_runtime_1.jsx)(IconBtn_1.IconBtn, { onClick: () => navigate(`/editor/${post.slug}`), Icon: ri_1.RiEditBoxFill, color: "text-white" }), (0, jsx_runtime_1.jsx)(IconBtn_1.IconBtn, { onClick: () => openModal("Confirm", {
                                        pen: false,
                                        err: false,
                                        msg: `Are you sure you want to delete ${post.title}?`,
                                        confirmationCallback: () => {
                                            openModal("Message", {
                                                err: false,
                                                pen: true,
                                                msg: "Deleting post...",
                                            });
                                            (0, posts_1.deletePost)(post.slug)
                                                .then(() => {
                                                openModal("Message", {
                                                    err: false,
                                                    pen: false,
                                                    msg: "Deleted post",
                                                });
                                            })
                                                .catch((e) => {
                                                openModal("Message", {
                                                    err: true,
                                                    pen: false,
                                                    msg: `${e}`,
                                                });
                                            });
                                        },
                                    }), Icon: ri_1.RiDeleteBin4Fill, "aria-label": "Delete", color: "text-rose-600" })] })))] })), (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: `flex flex-col my-auto h-fit justify-center items-${iState.breakPoint !== "sm" ? (reverse ? "end" : "start") : "center"} mx-auto grow p-1` }, { children: [(0, jsx_runtime_1.jsx)("h3", Object.assign({ style: { lineHeight: "0.9" }, className: `font-Archivo tracking-tight sm:text-sm md:text-lg sm:mx-auto md:mx-0 sm:py-0 pt-0 mb-0.5 sm:text-center ${reverse ? "md:text-right" : "md:text-left"}` }, { children: post.title })), (0, jsx_runtime_1.jsx)("p", Object.assign({ style: { lineHeight: "0.95" }, className: `sm:text-center px-0 sm:text-xs py-0.5 mb-0.5 sm:mx-auto md:mx-0 text-xs ${reverse ? "md:text-right" : "md:text-left"}` }, { children: post.description })), (0, jsx_runtime_1.jsx)("div", Object.assign({ "aria-label": "Tags", style: { filter: "drop-shadow(0px 1.5px 1px rgba(0,0,0,0.5))" }, className: `flex py-0.5 flex-wrap ${iState.breakPoint === "sm" ? "justify-center" : ""} ${reverse ? "md:justify-end" : "md:justify-start"} w-full gap-0.5` }, { children: post.tags.map((tag) => ((0, jsx_runtime_1.jsx)(Tag_1.default, { tag: tag }, tag))) })), (0, jsx_runtime_1.jsx)("span", Object.assign({ className: "sm:mx-auto mt-1 md:mx-0" }, { children: (0, jsx_runtime_1.jsx)(User_1.default, { likeShareIcons: true, liked: post.likedByMe, likes: post.likes, shared: post.sharedByMe, shares: post.shares, date: new Date(String(post.createdAt)), onLikeClick: () => likePost(post.id), onShareClick: () => sharePost(post.id), by: true, reverse: reverse, uid: String(post.author.id), user: getUserData(String(post.author.id)) }) })), (0, jsx_runtime_1.jsx)("div", { children: typeof post.commentCount !== undefined && ((0, jsx_runtime_1.jsx)("span", Object.assign({ "aria-label": "View post comments", className: `italic font-bold text-xs leading-3 px-0 bg-transparent tracking-tighter pt-2` }, { children: post.commentCount > 0
                                    ? `${post.commentCount} comment${post.commentCount > 1 ? "s" : ""}`
                                    : "No comments" }))) })] }))] })) : ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, {})) })));
}
exports.default = PostCard;
