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
import { IUser, useAuth } from "./AuthContext";
import { usePosts } from "./PostsContext";
import { useSocket } from "./SocketContext";
import useUsers from "./UsersContext";

export interface IPostComment {
  likeCount: number;
  likedByMe: boolean;
  message: string;
  id: string;
  parentId: string | undefined;
  createdAt: string;
  updatedAt: string;
  user: IUser;
}

const Context = createContext<{
  rootComments: any[];
  getReplies: (parentId: string) => IPostComment[];
  createLocalComment: (comment: IPostComment) => void;
  updateLocalComment: (id: string, message: string) => void;
  deleteLocalComment: (id: string) => void;
  toggleLocalCommentLike: (id: string, addLike: boolean) => void;
  replyingTo: string;
  setReplyingTo: (to: string) => void;
}>({
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
  const { getPostData } = usePosts();
  const { cacheUserData } = useUsers();

  const post = getPostData(String(slug));

  const [replyingTo, setReplyingTo] = useState("");

  useEffect(() => {
    if (socket) socket.emit("open_post", String(slug));
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

  const [comments, setComments] = useState<IPostComment[]>([]);
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

  const getReplies = (parentId: string): IPostComment[] =>
    commentsByParentId[parentId as keyof typeof commentsByParentId];

  const createLocalComment = (comment: IPostComment) =>
    setComments((prevComments) => [comment, ...prevComments]);

  const updateLocalComment = (id: string, message: string) =>
    setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === id
          ? { ...comment, message, updatedAt: new Date().toISOString() }
          : comment
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
      {children}
    </Context.Provider>
  );
}
