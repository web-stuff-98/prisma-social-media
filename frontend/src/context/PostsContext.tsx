import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  useMemo,
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
import { useParams } from "react-router-dom";
import { useFilter } from "./FilterContext";
import { debounce } from "lodash";

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
  commentCount?: number;
}

type DisappearedPost = {
  slug: string;
  disappearedAt: Date;
};

/*
    Posts context.
    Works in the same way as the UsersContext to receive live updates from
    socket.io depending on whether or not the post is visible.
    Comments are updated from PostContext
*/

const PostsContext = createContext<{
  error: string;
  status: "idle" | "pending" | "pending-search" | "error" | "success";

  // slug arrays
  pagePosts: string[];
  popularPosts: string[];
  postsOpen: string[];

  cachePostData: (slug: string, force?: boolean) => void;
  getPostData: (slug: string) => Partial<IPost> | undefined;

  visiblePosts: string[];
  disappearedPosts: DisappearedPost[];

  likePost: (id: string) => void;
  sharePost: (id: string) => void;

  openPost: (slug: string) => void;
  closePost: (slug: string) => void;

  postEnteredView: (slug: string) => void;
  postLeftView: (slug: string) => void;
}>({
  error: "",
  status: "idle",

  pagePosts: [],
  popularPosts: [],
  postsOpen: [],

  cachePostData: () => {},
  getPostData: () => undefined,

  likePost: () => {},
  sharePost: () => {},

  visiblePosts: [],
  disappearedPosts: [],

  openPost: () => {},
  closePost: () => {},

  postEnteredView: () => {},
  postLeftView: () => {},
});

export const PostsProvider = ({ children }: { children: ReactNode }) => {
  const { socket } = useSocket();
  const { cacheUserData } = useUsers();
  const { setPageCount, setFullCount, setMaxPage, searchTags, searchTerm, sortModeIndex, sortOrderIndex } =
    useFilter();
  const query = useParams();

  //Slugs only
  const [popularPosts, setPopularPosts] = useState<string[]>([]);
  const [pagePosts, setPagePosts] = useState<string[]>([]);
  const [postsOpen, setPostsOpen] = useState<string[]>([]);

  //Data
  const [postsData, setPostsData] = useState<Partial<IPost>[]>([]);

  //Caches full post data (including comments and body)
  const cachePostData = async (slug: string, force?: boolean) => {
    try {
      const found = postsData.find((p) => p.slug === slug);
      if (found && !force) return;
      const p = await getPost(slug);
      cacheUserData(p.author.id);
      addToPostsData([p]);
    } catch (e) {
      console.warn("Could not cache data for post " + slug);
      setErr(`${e}`);
    }
  };

  const [status, setStatus] = useState<
    "idle" | "pending" | "pending-search" | "error" | "success"
  >("idle");
  const [error, setError] = useState("");

  const addToPostsData = (data: Partial<IPost[]>) => {
    data.forEach((p) => cacheUserData(p?.author.id!));
    setPostsData((old: any) => [
      ...old.filter((p: Partial<IPost>) => !data.find((pd) => p.id === pd!.id)),
      ...data,
    ]);
  };

  const getAndSetPage = () => {
    const queryPortion:string = (window.location.href.split("/blog/")[1] || "").split("?")[1] || ""
    getPage(
      `${query.page ? Number(query.page) : 1}${queryPortion ? `?${queryPortion}` : ""}`
    )
      .then(
        (data: {
          posts: IPost[];
          maxPage: number;
          pageCount: number;
          fullCount: number;
        }) => {
          addToPostsData(data.posts);
          setPagePosts((p) => [...data.posts.map((p) => p.slug)]);
          setStatus("success");
          setMaxPage(data.maxPage);
          setPageCount(data.pageCount);
          setFullCount(data.fullCount);
        }
      )
      .catch((e) => {
        setError(`${e}`);
        setStatus("error");
      });
  };

  const handleGetAndSetPage = useMemo(
    () =>
      // the way this is set up is probably not good, should have implemented debouncing earlier on
      debounce(() => {
        getAndSetPage();
      }, 300),
    [searchTags, searchTerm, query.page]
  );

  useEffect(() => {
    if (!query.page) return;
    handleGetAndSetPage();
    setStatus("pending-search");
  }, [searchTags, searchTerm, query.page, sortOrderIndex, sortModeIndex]);

  const [err, setErr] = useState("");

  useEffect(() => {
    setStatus("pending");
    getAndSetPage();
    getPopularPosts()
      .then((posts) => {
        const slugs: string[] = posts.map((p: IPost) => p.slug);
        slugs.forEach((slug) => postEnteredView(slug));
        addToPostsData(posts);
        setPopularPosts(slugs);
      })
      .catch((e) => setErr(`Error getting popular posts : ${e}`));
  }, []);

  const openPost = (slug: string) => {
    socket?.emit("open_post", slug);
    setPostsOpen((p) => [...p.filter((checkSlug) => checkSlug !== slug), slug]);
    cachePostData(slug, true);
  };
  const closePost = (slug: string) => {
    socket?.emit("leave_post", slug);
    setPostsOpen((p) => [...p.filter((checkSlug) => checkSlug !== slug)]);
  };

  const likePost = async (id: string) => {
    try {
      const { addLike } = await toggleLike(id);
      setPostsData((p) => {
        let newPosts = p;
        const i = newPosts.findIndex((p) => p.id === id);
        newPosts[i] = {
          ...newPosts[i],
          likedByMe: !newPosts[i].likedByMe,
          likes: newPosts[i].likes! + (addLike ? 1 : -1),
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
      setPostsData((p) => {
        let newPosts = p;
        const i = newPosts.findIndex((p) => p.id === id);
        newPosts[i] = {
          ...newPosts[i],
          sharedByMe: !newPosts[i].sharedByMe,
          shares: newPosts[i].shares! + (addShare ? 1 : -1),
        };
        return [...newPosts];
      });
    } catch (e) {
      setErr(`${e}`);
    }
  };

  const getPostData = useCallback(
    (slug: string) => postsData.find((p: Partial<IPost>) => p.slug === slug),
    [postsData]
  );

  const [visiblePosts, setVisiblePosts] = useState<string[]>([]);
  const [disappearedPosts, setDisappearedPosts] = useState<DisappearedPost[]>(
    []
  );

  const subscribeToPost = useCallback(
    (slug: string) => {
      if (!socket) return;
      socket?.emit("post_card_visible", slug);
    },
    [socket]
  );
  const unsubscribeFromPost = useCallback(
    (slug: string) => {
      if (!socket) return;
      socket?.emit("post_card_not_visible", slug);
    },
    [socket]
  );

  const postEnteredView = (slug: string) => {
    setVisiblePosts((p) => [...p, slug]);
    setDisappearedPosts((p) => [...p.filter((p) => p.slug !== slug)]);
    subscribeToPost(slug);
  };
  const postLeftView = (slug: string) => {
    const visibleCount =
      visiblePosts.filter((visibleSlug) => visibleSlug === slug).length - 1;
    if (visibleCount === 0) {
      setVisiblePosts((p) => [
        ...p.filter((visibleSlug) => visibleSlug !== slug),
      ]);
      setDisappearedPosts((p) => [
        ...p.filter((p) => p.slug !== slug),
        {
          slug,
          disappearedAt: new Date(),
        },
      ]);
    } else {
      setVisiblePosts((p) => {
        //instead of removing all matching slugs, remove only one, because we need to retain the duplicates
        let newVisiblePosts = p;
        newVisiblePosts.splice(
          p.findIndex((vslug) => vslug === slug),
          1
        );
        return [...newVisiblePosts];
      });
    }
  };
  useEffect(() => {
    const i = setInterval(() => {
      const postsDisappeared30SecondsAgo = disappearedPosts
        .filter(
          (dp) => new Date().getTime() - dp.disappearedAt.getTime() > 30000
        )
        .map((dp) => dp.slug);
      setPostsData((p) => [
        ...p.filter((pd) => !postsDisappeared30SecondsAgo.includes(pd.slug!)),
      ]);
      setDisappearedPosts((p) => [
        ...p.filter((dp) => !postsDisappeared30SecondsAgo.includes(dp.slug)),
      ]);
      postsDisappeared30SecondsAgo.forEach((slug) => unsubscribeFromPost(slug));
    }, 5000);
    return () => {
      clearInterval(i);
    };
  }, [disappearedPosts]);

  const handleVisiblePostUpdate = (data: any) => {
    setPostsData((p: any) => {
      let newPosts = p;
      const foundIndex = p.findIndex((p: any) => p!.slug === data.slug);
      if (foundIndex === -1 || !newPosts[foundIndex]) return;
      newPosts[foundIndex] = { ...newPosts[foundIndex], ...data } as IPost;
      return newPosts;
    });
  };

  const handleVisiblePostCommentUpdate = (
    addComment: boolean,
    slug: string
  ) => {
    setPostsData((p: any) => {
      let newPosts = p;
      const foundIndex = p.findIndex((p: any) => p!.slug === slug);
      if (foundIndex === -1 || !newPosts[foundIndex]) return;
      newPosts[foundIndex] = {
        ...newPosts[foundIndex],
        commentCount: newPosts[foundIndex].commentCount + (addComment ? 1 : -1),
      } as IPost;
      return newPosts;
    });
  };

  const handleVisiblePostLikeUpdate = (
    addLike: boolean,
    sid: string,
    postId: string
  ) => {
    if (sid === socket?.id) return;
    //@ts-ignore
    setPostsData((p: any) => {
      let newPosts = p;
      const foundIndex = p.findIndex((p: any) => p!.id === postId);
      if (foundIndex === -1 || !newPosts[foundIndex]) return;
      newPosts[foundIndex] = {
        ...newPosts[foundIndex],
        likes: newPosts[foundIndex].likes + (addLike ? 1 : -1),
      } as IPost;
      return [...newPosts];
    });
  };

  const handleVisiblePostShareUpdate = (
    addShare: boolean,
    sid: string,
    postId: string
  ) => {
    if (sid === socket?.id) return;
    //@ts-ignore
    setPostsData((p: any) => {
      let newPosts = p;
      const foundIndex = p.findIndex((p: any) => p!.id === postId);
      if (foundIndex === -1 || !newPosts[foundIndex]) return;
      newPosts[foundIndex] = {
        ...newPosts[foundIndex],
        shares: newPosts[foundIndex].shares + (addShare ? 1 : -1),
      } as IPost;
      return [...newPosts];
    });
  };

  useEffect(() => {
    if (!socket) return;
    socket.on("post_visible_update", handleVisiblePostUpdate);
    socket.on("post_visible_like_update", handleVisiblePostLikeUpdate);
    socket.on("post_visible_share_update", handleVisiblePostShareUpdate);
    socket.on("post_visible_comment_update", handleVisiblePostCommentUpdate);
    socket.on("post_visible_deleted", getAndSetPage);
    return () => {
      socket.off("post_visible_update", handleVisiblePostUpdate);
      socket.off("post_visible_like_update", handleVisiblePostLikeUpdate);
      socket.off("post_visible_share_update", handleVisiblePostShareUpdate);
      socket.off("post_visible_comment_update", handleVisiblePostCommentUpdate);
      socket.off("post_visible_deleted", getAndSetPage);
    };
  }, [socket]);

  return (
    <PostsContext.Provider
      value={{
        error,
        status,
        pagePosts,
        popularPosts,
        postsOpen,
        visiblePosts,
        disappearedPosts,
        cachePostData,
        likePost,
        sharePost,
        getPostData,
        openPost,
        closePost,
        postEnteredView,
        postLeftView,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => useContext(PostsContext);
