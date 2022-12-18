"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_markdown_1 = __importDefault(require("react-markdown"));
const react_router_dom_1 = require("react-router-dom");
const Comment_1 = require("../components/comments/Comment");
const CommentForm_1 = require("../components/comments/CommentForm");
const IconBtn_1 = require("../components/IconBtn");
const User_1 = __importDefault(require("../components/User"));
const PostContext_1 = require("../context/PostContext");
const PostsContext_1 = require("../context/PostsContext");
const UsersContext_1 = __importDefault(require("../context/UsersContext"));
const comments_1 = require("../services/comments");
const ri_1 = require("react-icons/ri");
const AuthContext_1 = require("../context/AuthContext");
const ModalContext_1 = require("../context/ModalContext");
const posts_1 = require("../services/posts");
const Layout_1 = require("../components/layout/Layout");
const SocketContext_1 = require("../context/SocketContext");
const InterfaceContext_1 = require("../context/InterfaceContext");
function Post() {
    const { socket } = (0, SocketContext_1.useSocket)();
    const { rootComments, createLocalComment } = (0, PostContext_1.usePost)();
    const { getPostData, likePost, sharePost, openPost, closePost, postEnteredView, postLeftView, } = (0, PostsContext_1.usePosts)();
    const { getUserData } = (0, UsersContext_1.default)();
    const { openModal } = (0, ModalContext_1.useModal)();
    const { slug } = (0, react_router_dom_1.useParams)();
    const { user } = (0, AuthContext_1.useAuth)();
    const { state: iState } = (0, InterfaceContext_1.useInterface)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const containerRef = (0, react_1.useRef)(null);
    const post = getPostData(String(slug));
    (0, react_1.useEffect)(() => {
        if (!socket)
            return;
        socket.on("post_visible_deleted", (delSlug) => {
            if (delSlug === slug) {
                openModal("Message", {
                    msg: "The post you were reading was deleted.",
                    err: false,
                    pen: false,
                });
                navigate("/blog/1");
            }
        });
    }, [socket]);
    const [commentError, setCommentError] = (0, react_1.useState)("");
    const postComment = (message) => (0, comments_1.createComment)({ postId: String(post === null || post === void 0 ? void 0 : post.id), message })
        .then((data) => {
        createLocalComment(data);
        setCommentError("");
    })
        .catch((e) => setCommentError(`${e}`));
    (0, react_1.useEffect)(() => {
        if (slug) {
            openPost(slug);
            postEnteredView(slug);
        }
        return () => {
            closePost(slug);
            postLeftView(slug);
        };
    }, [slug]);
    const { scrollY } = (0, Layout_1.useScrollY)();
    return ((0, jsx_runtime_1.jsx)("div", Object.assign({ ref: containerRef, className: "w-full" }, { children: post ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", Object.assign({ style: {
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundImage: `url(https://d2gt89ey9qb5n6.cloudfront.net/${post === null || post === void 0 ? void 0 : post.imageKey})`,
                        backgroundPositionY: `calc(50% + ${scrollY * 0.5}px)`,
                    }, className: "w-full h-72 flex overflow-hidden text-white flex-col justify-end" }, { children: (0, jsx_runtime_1.jsxs)("div", Object.assign({ style: {
                            backdropFilter: "blur(2px)",
                            background: "rgba(0,0,0,0.166)",
                            borderTop: "1px outset rgba(255,255,255,0.1)",
                        }, className: "md:flex md:flex-row sm:flex sm:flex-col sm:justify-center p-2 dark:border-stone-800 drop-shadow-lg items-end pb-2" }, { children: [(0, jsx_runtime_1.jsx)("h1", Object.assign({ style: { textShadow: "0px 3px 4.5px black" }, className: "md:text-4xl sm:text-md font-bold grow mr-4" }, { children: post === null || post === void 0 ? void 0 : post.title })), (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "my-2 drop-shadow-xl flex flex-col md:justify-end items-end sm:justify-center w-fit" }, { children: [(0, jsx_runtime_1.jsx)(User_1.default, { style: { textShadow: "0px 3px 4.5px black" }, uid: String(post === null || post === void 0 ? void 0 : post.author.id), likeShareIcons: true, liked: post === null || post === void 0 ? void 0 : post.likedByMe, likes: post === null || post === void 0 ? void 0 : post.likes, shared: post === null || post === void 0 ? void 0 : post.sharedByMe, shares: post === null || post === void 0 ? void 0 : post.shares, onLikeClick: () => likePost(String(post === null || post === void 0 ? void 0 : post.id)), onShareClick: () => sharePost(String(post === null || post === void 0 ? void 0 : post.id)), date: (post === null || post === void 0 ? void 0 : post.createdAt) ? new Date(post.createdAt) : undefined, by: true, user: getUserData(String(post === null || post === void 0 ? void 0 : post.author.id)), reverse: iState.breakPoint !== "sm", fixDarkBackgroundContrast: true }), user && (post === null || post === void 0 ? void 0 : post.author.id) === (user === null || user === void 0 ? void 0 : user.id) && ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "flex gap-1 my-2" }, { children: [(0, jsx_runtime_1.jsx)(IconBtn_1.IconBtn, { "aria-label": "Edit post", onClick: () => navigate(`/editor/${post.slug}`), Icon: ri_1.RiEditBoxFill }), (0, jsx_runtime_1.jsx)(IconBtn_1.IconBtn, { onClick: () => {
                                                    openModal("Confirm", {
                                                        pen: false,
                                                        err: false,
                                                        msg: `Are you sure you want to delete ${post.title}?`,
                                                        confirmationCallback: () => {
                                                            navigate("/blog/1");
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
                                                    });
                                                }, Icon: ri_1.RiDeleteBin4Fill, "aria-label": "Delete", color: "text-rose-600" })] })))] }))] })) })), (0, jsx_runtime_1.jsx)("div", Object.assign({ className: "p-2 prose prose-sm\r\n                  dark:prose-headings:text-white\r\n                  dark:prose-headings:font-bold\r\n                  dark:prose-lead:text-white\r\n                  dark:prose-p:text-white\r\n                  dark:prose-blockquote:text-white\r\n                  dark:prose-li:text-white\r\n                  dark:prose-strong:text-white\r\n                  dark:prose-figure:text-white\r\n                  dark:prose-figcaption:text-white\r\n                  dark:prose-table:text-white\r\n                  dark:prose-tr:text-white\r\n                  dark:prose-th:text-white\r\n                  dark:prose-td:text-white\r\n                  prose-a:text-indigo-500\r\n                  prose-a:font-bold\r\n      max-w-none" }, { children: (0, jsx_runtime_1.jsx)(react_markdown_1.default, { children: String(post === null || post === void 0 ? void 0 : post.body) }) })), (0, jsx_runtime_1.jsxs)("section", Object.assign({ className: "w-full p-2 mt-6" }, { children: [(0, jsx_runtime_1.jsx)("div", Object.assign({ className: "mx-auto py-0.5 text-xs text-center" }, { children: !post.commentCount
                                ? "No comments"
                                : `${post.commentCount} comment${post.commentCount > 1 && "s"}` })), user && ((0, jsx_runtime_1.jsx)(CommentForm_1.CommentForm, { placeholder: "Add a comment...", loading: false, error: commentError, onSubmit: postComment })), rootComments != null && rootComments.length > 0 && ((0, jsx_runtime_1.jsx)("div", Object.assign({ className: "mt-4 pb-1 w-full" }, { children: rootComments.map((comment) => ((0, jsx_runtime_1.jsx)("div", Object.assign({ className: "w-full h-full" }, { children: (0, jsx_runtime_1.jsx)(Comment_1.Comment, Object.assign({}, comment)) }), comment.id))) })))] }))] })) : ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, {})) })));
}
exports.default = Post;
