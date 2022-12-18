"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostProvider = exports.usePost = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const AuthContext_1 = require("./AuthContext");
const PostsContext_1 = require("./PostsContext");
const SocketContext_1 = require("./SocketContext");
const UsersContext_1 = __importDefault(require("./UsersContext"));
const Context = (0, react_1.createContext)({
    rootComments: [],
    getReplies: () => [],
    createLocalComment: () => { },
    updateLocalComment: () => { },
    deleteLocalComment: () => { },
    toggleLocalCommentLike: () => { },
    replyingTo: "",
    setReplyingTo: () => { },
});
const usePost = () => (0, react_1.useContext)(Context);
exports.usePost = usePost;
function PostProvider({ children }) {
    const { slug } = (0, react_router_dom_1.useParams)();
    const { socket } = (0, SocketContext_1.useSocket)();
    const { user } = (0, AuthContext_1.useAuth)();
    const { getPostData } = (0, PostsContext_1.usePosts)();
    const { cacheUserData } = (0, UsersContext_1.default)();
    const post = getPostData(String(slug));
    const [replyingTo, setReplyingTo] = (0, react_1.useState)("");
    (0, react_1.useEffect)(() => {
        if (socket)
            socket.emit("open_post", String(slug));
        return () => {
            if (socket)
                socket.emit("leave_post", String(slug));
        };
    }, [slug]);
    const handleCommentAdded = (0, react_1.useCallback)((message, commentId, parentId, uid, name) => {
        if (uid === (user === null || user === void 0 ? void 0 : user.id))
            return;
        const dateString = new Date().toISOString();
        createLocalComment({
            message,
            likeCount: 0,
            likedByMe: false,
            id: commentId,
            parentId: parentId,
            createdAt: dateString,
            updatedAt: dateString,
            user: {
                id: uid,
                name,
            },
        });
        cacheUserData(uid);
    }, []);
    const handleCommentUpdated = (0, react_1.useCallback)((message, commentId, uid) => {
        if (uid === (user === null || user === void 0 ? void 0 : user.id))
            return;
        updateLocalComment(commentId, message);
    }, []);
    const handleCommentDeleted = (0, react_1.useCallback)((commentId, uid) => {
        if (uid === (user === null || user === void 0 ? void 0 : user.id))
            return;
        deleteLocalComment(commentId);
    }, []);
    const handleCommentLiked = (0, react_1.useCallback)((addLike, uid) => {
        if (uid === (user === null || user === void 0 ? void 0 : user.id))
            return;
        toggleLocalCommentLike(uid, addLike);
    }, []);
    (0, react_1.useEffect)(() => {
        if (!socket)
            return;
        socket.on("comment_added", handleCommentAdded);
        socket.on("comment_updated", handleCommentUpdated);
        socket.on("comment_deleted", handleCommentDeleted);
        socket.on("comment_liked", handleCommentLiked);
        return () => {
            socket.off("comment_added", handleCommentAdded);
            socket.off("comment_updated", handleCommentUpdated);
            socket.off("comment_liked", handleCommentLiked);
            socket.off("comment_deleted", handleCommentDeleted);
        };
    }, [socket]);
    const [comments, setComments] = (0, react_1.useState)([]);
    const commentsByParentId = (0, react_1.useMemo)(() => {
        const group = {};
        comments.forEach((comment) => {
            var _a;
            group[_a = String(comment.parentId)] || (group[_a] = []);
            group[String(comment.parentId)].push(comment);
        });
        return group;
    }, [comments]);
    (0, react_1.useEffect)(() => {
        if ((post === null || post === void 0 ? void 0 : post.comments) == null)
            return;
        setComments(post.comments);
    }, [post === null || post === void 0 ? void 0 : post.comments]);
    const getReplies = (parentId) => commentsByParentId[parentId];
    const createLocalComment = (comment) => setComments((prevComments) => [comment, ...prevComments]);
    const updateLocalComment = (id, message) => setComments((prevComments) => prevComments.map((comment) => comment.id === id
        ? Object.assign(Object.assign({}, comment), { message, updatedAt: new Date().toISOString() }) : comment));
    const deleteLocalComment = (id) => setComments((prevComments) => prevComments.filter((comment) => comment.id !== id));
    const toggleLocalCommentLike = (id, addLike) => {
        setComments((prevComments) => prevComments.map((comment) => {
            if (id === comment.id) {
                if (addLike) {
                    return Object.assign(Object.assign({}, comment), { likeCount: comment.likeCount + 1, likedByMe: true });
                }
                else {
                    return Object.assign(Object.assign({}, comment), { likeCount: comment.likeCount - 1, likedByMe: false });
                }
            }
            else {
                return comment;
            }
        }));
    };
    return ((0, jsx_runtime_1.jsx)(Context.Provider, Object.assign({ value: {
            rootComments: commentsByParentId["null"],
            getReplies,
            createLocalComment,
            updateLocalComment,
            deleteLocalComment,
            toggleLocalCommentLike,
            replyingTo,
            setReplyingTo,
        } }, { children: children })));
}
exports.PostProvider = PostProvider;
