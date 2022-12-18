"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const IconBtn_1 = require("../IconBtn");
const ai_1 = require("react-icons/ai");
const fa_1 = require("react-icons/fa");
const PostContext_1 = require("../../context/PostContext");
const react_1 = require("react");
const comments_1 = require("../../services/comments");
const CommentForm_1 = require("./CommentForm");
const AuthContext_1 = require("../../context/AuthContext");
const User_1 = __importDefault(require("../User"));
const UsersContext_1 = __importDefault(require("../../context/UsersContext"));
const PostsContext_1 = require("../../context/PostsContext");
const react_router_dom_1 = require("react-router-dom");
const ModalContext_1 = require("../../context/ModalContext");
const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
});
function Comment({ id, message, user, createdAt, updatedAt, likeCount, likedByMe, }) {
    const { openModal } = (0, ModalContext_1.useModal)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { slug } = (0, react_router_dom_1.useParams)();
    /*
  This function is from the web dev simplified video. It is supposed to be in the useAsync hook but that was causing infinite rerenders in the original PostContext, so I changed it to the useAync hook from usehooks.com and it worked. But I'll keep this function here anyway because it works here and dont need to change anything aside from the name.
  */
    function useAsyncFn(func, dependencies = []) {
        const [loading, setLoading] = (0, react_1.useState)(false);
        const [error, setError] = (0, react_1.useState)();
        const [value, setValue] = (0, react_1.useState)();
        const execute = (0, react_1.useCallback)((...params) => {
            setLoading(true);
            return func(...params)
                .then((data) => {
                setValue(data);
                setError(undefined);
                return data;
            })
                .catch((error) => {
                setError(error);
                setValue(undefined);
                return Promise.reject(error);
            })
                .finally(() => {
                setLoading(false);
            });
        }, dependencies);
        return { loading, error, value, execute };
    }
    const [areChildrenHidden, setAreChildrenHidden] = (0, react_1.useState)(true);
    const [isEditing, setIsEditing] = (0, react_1.useState)(false);
    const { getReplies, createLocalComment, updateLocalComment, deleteLocalComment, toggleLocalCommentLike, } = (0, PostContext_1.usePost)();
    const { getPostData } = (0, PostsContext_1.usePosts)();
    const post = getPostData(String(slug));
    const createCommentFn = useAsyncFn(comments_1.createComment);
    const updateCommentFn = useAsyncFn(comments_1.updateComment);
    const deleteCommentFn = useAsyncFn(comments_1.deleteComment);
    const toggleCommentLikeFn = useAsyncFn(comments_1.toggleCommentLike);
    const childComments = getReplies(id);
    const { user: currentUser } = (0, AuthContext_1.useAuth)();
    const { setReplyingTo, replyingTo } = (0, PostContext_1.usePost)();
    const { getUserData } = (0, UsersContext_1.default)();
    const onCommentReply = (message) => {
        if (!currentUser) {
            navigate("/login");
            return;
        }
        createCommentFn
            .execute({ postId: post === null || post === void 0 ? void 0 : post.id, message, parentId: id })
            .then((comment) => {
            if (replyingTo === id)
                setReplyingTo("");
            createLocalComment(comment);
        });
    };
    const onCommentUpdate = (message) => updateCommentFn
        .execute({ postId: post === null || post === void 0 ? void 0 : post.id, message, id })
        .then((comment) => {
        setIsEditing(false);
        updateLocalComment(id, comment.message);
    });
    const onCommentDelete = () => {
        openModal("Confirm", {
            err: false,
            pen: false,
            msg: "Are you sure you want to delete this comment?",
            confirmationCallback: () => {
                deleteCommentFn
                    .execute({ postId: post === null || post === void 0 ? void 0 : post.id, id })
                    .then((comment) => deleteLocalComment(comment.id));
            },
        });
    };
    const onToggleCommentLike = () => {
        if (!currentUser) {
            navigate("/login");
            return;
        }
        toggleCommentLikeFn
            .execute({ id, postId: post === null || post === void 0 ? void 0 : post.id })
            .then(({ addLike }) => toggleLocalCommentLike(id, addLike));
    };
    const [hideRepliesBarHover, setHideRepliesBarHover] = (0, react_1.useState)(false);
    const handleHideRepliesBarEnter = () => setHideRepliesBarHover(true);
    const handleHideRepliesBarLeave = () => setHideRepliesBarHover(false);
    const getDateString = (date) => dateFormatter.format(date);
    const renderEditedAtTimeString = (dateString) => ((0, jsx_runtime_1.jsxs)("b", Object.assign({ style: { filter: "opacity(0.333)" }, className: "pl-2" }, { children: ["Edited ", dateString] })));
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", Object.assign({ className: "w-full mb-2 flex" }, { children: (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "flex flex-col items-start w-full" }, { children: [(0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "mr-4 my-auto flex justify-between items-center w-full" }, { children: [(0, jsx_runtime_1.jsx)(User_1.default, { editDeleteIcons: currentUser && currentUser.id === user.id, onDeleteClick: () => onCommentDelete(), onEditClick: () => setIsEditing((p) => !p), isEditing: isEditing, isDeleting: deleteCommentFn.loading, date: new Date(createdAt), user: getUserData(user.id), uid: user.id }), (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "flex flex-col" }, { children: [(0, jsx_runtime_1.jsx)(IconBtn_1.IconBtn, Object.assign({ onClick: onToggleCommentLike, disabled: toggleCommentLikeFn.loading, Icon: likedByMe ? ai_1.AiFillLike : ai_1.AiOutlineLike, "aria-label": likedByMe ? "Unlike" : "Like" }, { children: (0, jsx_runtime_1.jsx)("div", Object.assign({ style: { left: "50%", top: "-50%" }, className: "drop-shadow-md absolute text-green-500" }, { children: likeCount })) })), (0, jsx_runtime_1.jsx)(IconBtn_1.IconBtn, { onClick: () => {
                                                if (replyingTo !== id)
                                                    setReplyingTo(id);
                                                else
                                                    setReplyingTo("");
                                            }, isActive: replyingTo === id, Icon: fa_1.FaReply, "aria-label": replyingTo === id ? "Cancel Reply" : "Reply" })] }))] })), (0, jsx_runtime_1.jsx)("div", Object.assign({ className: "w-full flex items-center" }, { children: isEditing ? ((0, jsx_runtime_1.jsx)(CommentForm_1.CommentForm, { autoFocus: true, initialValue: message, onSubmit: onCommentUpdate, loading: updateCommentFn.loading, error: updateCommentFn.error, placeholder: "Edit comment...", onClickOutside: () => setIsEditing(false) })) : ((0, jsx_runtime_1.jsxs)("p", Object.assign({ className: "flex my-auto leading-4 tracking-tight text-xs p-0 grow items-center" }, { children: [message, updatedAt !== createdAt &&
                                        renderEditedAtTimeString(getDateString(new Date(updatedAt)))] }))) })), deleteCommentFn.error && ((0, jsx_runtime_1.jsx)("div", Object.assign({ className: "error-msg mt-1" }, { children: deleteCommentFn.error })))] })) })), replyingTo === id && currentUser && ((0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsx)(CommentForm_1.CommentForm, { autoFocus: true, onSubmit: onCommentReply, loading: createCommentFn.loading, error: createCommentFn.error, placeholder: "Reply to comment...", onClickOutside: () => setReplyingTo("") }) })), (childComments === null || childComments === void 0 ? void 0 : childComments.length) > 0 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", Object.assign({ style: { paddingLeft: "10%" }, className: `relative mb-2 ${areChildrenHidden ? "hidden" : ""}` }, { children: [(0, jsx_runtime_1.jsx)("button", Object.assign({ style: {
                                    position: "absolute",
                                    left: "calc(1rem - 1px)",
                                    height: "100%",
                                    width: "10px",
                                }, className: "flex justify-center px-0 bg-transparent", onMouseEnter: handleHideRepliesBarEnter, onMouseLeave: handleHideRepliesBarLeave, "aria-label": "Hide Replies", onClick: () => setAreChildrenHidden(true) }, { children: (0, jsx_runtime_1.jsx)("span", { style: {
                                        width: "2px",
                                        borderRadius: "2px",
                                        transition: "100ms linear background",
                                    }, className: `${hideRepliesBarHover ? "bg-amber-600" : "bg-stone-300"} h-full` }) })), (0, jsx_runtime_1.jsx)("div", Object.assign({ className: "nested-comments" }, { children: childComments.map((comment) => ((0, jsx_runtime_1.jsx)("div", Object.assign({ className: "w-full h-full" }, { children: (0, jsx_runtime_1.jsx)(Comment, Object.assign({}, comment)) }), comment.id))) }))] })), (0, jsx_runtime_1.jsx)("button", Object.assign({ className: `btn bg-transparent italic text-black px-0 mb-2 text-xs ${!areChildrenHidden ? "hidden" : ""}`, onClick: () => setAreChildrenHidden(false) }, { children: "Show Replies" }))] }))] }));
}
exports.Comment = Comment;
