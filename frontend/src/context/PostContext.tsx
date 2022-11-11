import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import { getPost } from "../services/posts";
import { IUser, useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

export interface IPost {
  id: string;
  title: string;
  description: string;
  body: string;
  author: Partial<IUser>;
  comments?: IComment[];
  createdAt?: string;
  slug: string;
}

export interface IComment {
  likeCount: number;
  likedByMe: boolean;
  message: string;
  id: string;
  parentId: string;
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
});

export const usePost = () => useContext(Context);

export function PostProvider({ children }: { children: ReactNode }) {
  const { slug } = useParams();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [status, setStatus] = useState("pending");
  const [error, setError] = useState("");
  const [post, setPost] = useState<IPost>({
    id: "123",
    title: "post",
    body: "body",
    author: { id: "123", name: "authorname" },
    comments: [],
    slug: "123",
    description: "",
  });
  const [replyingTo, setReplyingTo] = useState("");

  useEffect(() => {
    getPost(String(slug))
      .then((post) => {
        setPost(post);
        setError("");
        setStatus("success");
        if (socket) {
          socket.emit("openPost", String(slug));
        }
      })
      .catch((e) => {
        setStatus("error");
        setError(`${e}`);
      });
    return () => {
      if (socket) socket.emit("leavePost", String(slug));
    };
  }, [slug]);

  useEffect(() => {
    if (!socket) return;
    socket.on(
      "commentAdded",
      (message = "", commentId = "", parentId = "", uid = "", name = "") => {
        if (uid === user?.id) return;
        createLocalComment({
          message,
          likeCount: 0,
          likedByMe: false,
          id: commentId,
          parentId: parentId || "",
          createdAt: new Date().toISOString(),
          user: {
            id: uid,
            name,
          },
        });
      }
    );
    socket.on("commentUpdated", (message, commentId, uid) => {
      if (uid === user?.id) return;
    });
    socket.on("commentDeleted", (commentId, uid) => {
      if (uid === user?.id) return;
    });
    socket.on("commentLiked", (addLike, uid) => {
      if (uid === user?.id) return;
    });
  }, [socket]);

  const [comments, setComments] = useState<IComment[]>([]);
  const commentsByParentId = useMemo(() => {
    // any type here... dont know how to resolve this properly. doesn't actually matter anyway.
    const group: any = {};
    comments.forEach((comment) => {
      group[comment.parentId] ||= [];
      group[comment.parentId].push(comment);
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
