import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import {
  getPage,
  getPopularPosts,
  getPost,
  toggleLike,
  toggleShare,
} from "../services/posts";
import { useSocket } from "./SocketContext";
import useUsers from "./UsersContext";
import { IPostComment } from "./PostContext";
import { useParams, useSearchParams } from "react-router-dom";
import { useFilter } from "./FilterContext";

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
  blur: string;
  imageKey: string;
}

/*
    Posts context.
    Works in the same way as the UsersContext to receive live updates from
    socket.io depending on whether or not the post is visible.
    Comments are updated from PostContext
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
  popularPosts: string[];
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
  popularPosts: [],
});

export const PostsProvider = ({ children }: { children: ReactNode }) => {
  const { socket } = useSocket();
  const { cacheUserData } = useUsers();
  const { setPageCount, setFullCount, setMaxPage, searchTags, searchTerm } =
    useFilter();
  const query = useParams();

  const [searchParams] = useSearchParams();
  const [postsOpen, setPostsOpen] = useState<string[]>([]);
  const [popularPosts, setPopularPosts] = useState<string[]>([]);

  const [posts, setPosts] = useState<IPost[]>([]);
  const [status, setStatus] = useState<
    "idle" | "pending" | "error" | "success"
  >("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query.page) return;
    setStatus("pending");
    getPage(
      Number(query.page),
      searchParams.get("tags") || "",
      searchParams.get("term") || ""
    )
      .then((data: any) => {
        setPosts(data.posts);
        setStatus("success");
        setMaxPage(data.maxPage);
        setPageCount(data.pageCount);
        setFullCount(data.fullCount);
      })
      .catch((e) => {
        setError(`${e}`);
        setStatus("error");
      });
  }, [searchTags, searchTerm, query.page]);

  const [err, setErr] = useState("");

  useEffect(() => {
    getPopularPosts()
      .then((posts) => {
        setPopularPosts(posts.map((p: IPost) => p.slug));
      })
      .catch((e) => setErr(`Error getting popular posts : ${e}`));
  }, []);

  const openPost = (slug: string) => {
    const post: IPost = posts.find((p) => p.slug === slug)!;
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
    const post: IPost = posts.find((p) => p.slug === slug)!;
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
    (slug: string) => posts.find((p: IPost) => p.slug === slug),
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
        popularPosts,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => useContext(PostsContext);
