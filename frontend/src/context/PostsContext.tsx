import { createContext, useContext, useCallback, useState } from "react";
import type { ReactNode } from "react";
import { IPost } from "./PostContext";
import useCustomArrayAsync from "../hooks/useCustomArrayAsync";
import { getPosts, toggleLike, toggleShare } from "../services/posts";
import { useSocket } from "./SocketContext";
import useUsers from "./UsersContext";

/*
    Posts context.
    I am going to make everything live, but currently only comments are
    updated live via socket.io

    This context is not currently being used, I will hook it up eventually

    openPost is going to be called when
    the user opens the post to open the connection by joining a room, and
    closePost is called when the user stops reading a post to stop
    receiving post updates.

    it uses THE POSTS SLUG, NOT THE POSTS ID to identify what posts the
    client has open (not sure why I even have the id, its just an extra
    column).
*/

const PostsContext = createContext<{
  posts: IPost[];
  error: unknown;
  status: "idle" | "pending" | "success" | "error";
  likePost: (pid: string) => void;
  sharePost: (pid: string) => void;
  getPostData: (pid: string) => void;
  openPost: (pid: string) => void;
  closePost: (pid: string) => void;
  postsOpen: string[];
}>({
  posts: [],
  error: null,
  status: "idle",
  likePost: () => {},
  sharePost: () => {},
  getPostData: () => {},
  openPost: () => {},
  closePost: () => {},
  postsOpen: [],
});

export const PostsProvider = ({ children }: { children: ReactNode }) => {
  const { socket } = useSocket();
  const { cacheUserData } = useUsers();

  const [postsOpen, setPostsOpen] = useState<string[]>([]);

  const {
    error,
    status,
    value: posts,
    setValueState: setPosts,
  } = useCustomArrayAsync(
    getPosts,
    [],
    "post_updated",
    "post_deleted",
    "post_created"
  );

  const [err, setErr] = useState("");

  const openPost = (slug: string) => {
    const post: IPost = posts.find((p) => p.slug === slug);
    cacheUserData(post.author.id);
    socket?.emit("open_post", post.slug);
    setPostsOpen((p) => [...p.filter((checkSlug) => checkSlug !== slug), slug]);
  };
  const closePost = (slug: string) => {
    const post: IPost = posts.find((p) => p.slug === slug);
    socket?.emit("leave_post", post.slug);
    setPostsOpen((p) => [...p.filter((checkSlug) => checkSlug !== slug)]);
  };

  const likePost = async (pid: string) => {
    try {
      await toggleLike(pid);
      setPosts((p) => {
        let newPosts = p;
        const i = newPosts.find((p) => p.id === pid);
        newPosts[i] = { ...newPosts[i], likedByMe: !newPosts[i].likedByMe };
        return [...newPosts];
      });
    } catch (e) {
      setErr(`${e}`);
    }
  };
  const sharePost = async (pid: string) => {
    try {
      await toggleShare(pid);
      setPosts((p) => {
        let newPosts = p;
        const i = newPosts.find((p) => p.id === pid);
        newPosts[i] = { ...newPosts[i], sharedByMe: !newPosts[i].sharedByMe };
        return [...newPosts];
      });
    } catch (e) {
      setErr(`${e}`);
    }
  };

  // probably wont end up using this
  const getPostData = useCallback(
    (pid: string) => {
      return posts.find((p: IPost) => p.id === pid);
    },
    [posts]
  );

  return (
    <PostsContext.Provider
      value={{
        error,
        status,
        posts,
        likePost,
        sharePost,
        getPostData,
        openPost,
        closePost,
        postsOpen,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => useContext(PostsContext);
