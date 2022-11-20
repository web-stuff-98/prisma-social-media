import { createContext, useContext, useCallback, useState } from "react";
import type { ReactNode } from "react";
import useCustomArrayAsync from "../hooks/useCustomArrayAsync";
import { getPost, getPosts, toggleLike, toggleShare } from "../services/posts";
import { useSocket } from "./SocketContext";
import useUsers from "./UsersContext";
import { IPostComment } from "./PostContext";

export interface IPost {
  id: string;
  title: string;
  description: string;
  tags: string[];
  body: string;
  author: { id: string };
  comments?: IPostComment[];
  createdAt?: string;
  slug: string;
  likedByMe?: boolean;
  sharedByMe?: boolean;
  likes: number;
  shares: number;
}

/*
    Posts context.
    Works in the same way as the UsersContext to receive live updates from
    socket.io depending on whether or not the post is visible. Comments
    are updated from PostContext (this is PostsContext with an S)

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
  likePost: (id: string) => void;
  sharePost: (id: string) => void;
  getPostData: (slug: string) => IPost | undefined;
  openPost: (slug: string) => void;
  closePost: (slug: string) => void;
  postsOpen: string[];
}>({
  posts: [],
  error: null,
  status: "idle",
  likePost: () => {},
  sharePost: () => {},
  getPostData: () => undefined,
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
    socket?.emit("open_post_comments", post.slug);
    setPostsOpen((p) => [...p.filter((checkSlug) => checkSlug !== slug), slug]);
    getPost(slug)
      .then((post) => {
        cacheUserData(post.author.id);
        setPosts((p) => [...p.filter((p) => p.slug !== slug), post]);
      })
      .catch((e) => setErr(`${e}`));
  };
  const closePost = (slug: string) => {
    const post: IPost = posts.find((p) => p.slug === slug);
    socket?.emit("leave_post_comments", post.slug);
    setPostsOpen((p) => [...p.filter((checkSlug) => checkSlug !== slug)]);
  };

  const likePost = async (id: string) => {
    try {
      const { addLike } = await toggleLike(id);
      setPosts((p) => {
        let newPosts = p;
        const i = newPosts.findIndex((p) => p.id === id);
        newPosts[i] = {
          ...newPosts[i],
          likedByMe: !newPosts[i].likedByMe,
          likes: newPosts[i].likes + (addLike ? 1 : -1),
        };
        return [...newPosts];
      });
    } catch (e) {
      setErr(`${e}`);
    }
  };
  const sharePost = async (id: string) => {
    try {
      const { addShare } = await toggleShare(id);
      setPosts((p) => {
        let newPosts = p;
        const i = newPosts.findIndex((p) => p.id === id);
        newPosts[i] = {
          ...newPosts[i],
          sharedByMe: !newPosts[i].sharedByMe,
          shares: newPosts[i].shares + (addShare ? 1 : -1),
        };
        return [...newPosts];
      });
    } catch (e) {
      setErr(`${e}`);
    }
  };

  const getPostData = useCallback(
    (slug: string) => {
      return posts.find((p: IPost) => p.slug === slug);
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
