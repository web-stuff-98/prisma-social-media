import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import { getPost, toggleLike, toggleShare } from "../services/posts";
import { IUser, useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import useUsers from "./UsersContext";

export interface IPost {
  id: string;
  title: string;
  description: string;
  body: string;
  author: { id: string };
  comments?: IComment[];
  createdAt?: string;
  slug: string;
  likedByMe?: boolean;
  sharedByMe?: boolean;
  likes: number;
  shares: number;
}

export interface IComment {
  likeCount: number;
  likedByMe: boolean;
  message: string;
  id: string;
  parentId: string | undefined;
  createdAt: string;
  user: IUser;
}

const Context = createContext<{
  post?: IPost;
  rootComments: any[];
  getReplies: (parentId: string) => IComment[];
  createLocalComment: (comment: IComment) => void;
  updateLocalComment: (id: string, message: string) => void;
  deleteLocalComment: (id: string) => void;
  toggleLocalCommentLike: (id: string, addLike: boolean) => void;
  replyingTo: string;
  setReplyingTo: (to: string) => void;
  handleLikeClicked: () => void;
  handleShareClicked: () => void;
}>({
  post: undefined,
  rootComments: [],
  getReplies: () => [],
  createLocalComment: () => {},
  updateLocalComment: () => {},
  deleteLocalComment: () => {},
  toggleLocalCommentLike: () => {},
  replyingTo: "",
  setReplyingTo: () => {},
  handleLikeClicked: () => {},
  handleShareClicked: () => {},
});

export const usePost = () => useContext(Context);

export function PostProvider({ children }: { children: ReactNode }) {
  const { slug } = useParams();
  const { socket } = useSocket();
  const { user } = useAuth();
  const { cacheUserData } = useUsers();

  const [status, setStatus] = useState("pending");
  const [error, setError] = useState("");
  const [post, setPost] = useState<IPost>({
    id: "123",
    title: "post",
    body: "body",
    author: { id: "123" },
    comments: [],
    slug: "123",
    description: "",
    likes: 0,
    shares: 0,
    likedByMe: false,
    sharedByMe: false,
  });
  const [replyingTo, setReplyingTo] = useState("");

  const handleLikeClicked = async () => {
    try {
      await toggleLike(post.id);
      setPost((p) => ({ ...p, likedByMe: !p.likedByMe }));
    } catch (e) {
      setError(`${e}`);
    }
  };

  const handleShareClicked = async () => {
    try {
      await toggleShare(post.id);
      setPost((p) => ({ ...p, sharedByMe: !p.sharedByMe }));
    } catch (e) {
      setError(`${e}`);
    }
  };

  useEffect(() => {
    getPost(String(slug))
      .then((post) => {
        setPost(post);
        setError("");
        setStatus("success");
        cacheUserData(post.author.id);
        if (socket) {
          socket.emit("open_post", String(slug));
        }
      })
      .catch((e) => {
        setStatus("error");
        setError(`${e}`);
      });
    return () => {
      if (socket) socket.emit("leave_post", String(slug));
    };
  }, [slug]);

  const handleCommentAdded = useCallback(
    (
      message: string,
      commentId: string,
      parentId: string | undefined,
      uid: string,
      name: string
    ) => {
      if (uid === user?.id) return;
      createLocalComment({
        message,
        likeCount: 0,
        likedByMe: false,
        id: commentId,
        parentId: parentId,
        createdAt: new Date().toISOString(),
        user: {
          id: uid,
          name,
        },
      });
      cacheUserData(uid);
    },
    []
  );
  const handleCommentUpdated = useCallback(
    (message: string, commentId: string, uid: string) => {
      if (uid === user?.id) return;
      updateLocalComment(commentId, message);
    },
    []
  );
  const handleCommentDeleted = useCallback((commentId: string, uid: string) => {
    if (uid === user?.id) return;
    deleteLocalComment(commentId);
  }, []);
  const handleCommentLiked = useCallback((addLike: boolean, uid: string) => {
    if (uid === user?.id) return;
    toggleLocalCommentLike(uid, addLike);
  }, []);

  useEffect(() => {
    if (!socket) return;
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

  const [comments, setComments] = useState<IComment[]>([]);
  const commentsByParentId = useMemo(() => {
    const group: any = {};
    comments.forEach((comment) => {
      group[String(comment.parentId)] ||= [];
      group[String(comment.parentId)].push(comment);
    });
    return group;
  }, [comments]);

  useEffect(() => {
    if (post?.comments == null) return;
    setComments(post.comments);
  }, [post?.comments]);

  const getReplies = (parentId: string): IComment[] =>
    commentsByParentId[parentId as keyof typeof commentsByParentId];

  const createLocalComment = (comment: IComment) =>
    setComments((prevComments) => [comment, ...prevComments]);

  const updateLocalComment = (id: string, message: string) =>
    setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === id ? { ...comment, message } : comment
      )
    );

  const deleteLocalComment = (id: string) =>
    setComments((prevComments) =>
      prevComments.filter((comment) => comment.id !== id)
    );

  const toggleLocalCommentLike = (id: string, addLike: boolean) => {
    setComments((prevComments) =>
      prevComments.map((comment) => {
        if (id === comment.id) {
          if (addLike) {
            return {
              ...comment,
              likeCount: comment.likeCount + 1,
              likedByMe: true,
            };
          } else {
            return {
              ...comment,
              likeCount: comment.likeCount - 1,
              likedByMe: false,
            };
          }
        } else {
          return comment;
        }
      })
    );
  };

  return (
    <Context.Provider
      value={{
        post,
        rootComments: commentsByParentId["null"],
        getReplies,
        createLocalComment,
        updateLocalComment,
        deleteLocalComment,
        toggleLocalCommentLike,
        handleLikeClicked,
        handleShareClicked,
        replyingTo,
        setReplyingTo,
      }}
    >
      {status === "pending" ? (
        <h1>Loading</h1>
      ) : error ? (
        <h1 className="text-rose-600">{error}</h1>
      ) : (
        children
      )}
    </Context.Provider>
  );
}
