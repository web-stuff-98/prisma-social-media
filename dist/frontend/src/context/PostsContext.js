"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePosts = exports.PostsProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const posts_1 = require("../services/posts");
const SocketContext_1 = require("./SocketContext");
const UsersContext_1 = __importDefault(require("./UsersContext"));
const react_router_dom_1 = require("react-router-dom");
const FilterContext_1 = require("./FilterContext");
const lodash_1 = require("lodash");
/*
    Posts context.
    Works in the same way as the UsersContext to receive live updates from
    socket.io depending on whether or not the post is visible.
    Comments are updated from PostContext
*/
const PostsContext = (0, react_1.createContext)({
    error: "",
    status: "idle",
    pagePosts: [],
    popularPosts: [],
    postsOpen: [],
    cachePostData: () => { },
    getPostData: () => undefined,
    likePost: () => { },
    sharePost: () => { },
    visiblePosts: [],
    disappearedPosts: [],
    openPost: () => { },
    closePost: () => { },
    postEnteredView: () => { },
    postLeftView: () => { },
});
const PostsProvider = ({ children }) => {
    const { socket } = (0, SocketContext_1.useSocket)();
    const { cacheUserData } = (0, UsersContext_1.default)();
    const { setPageCount, setFullCount, setMaxPage, searchTags, searchTerm, sortModeIndex, sortOrderIndex } = (0, FilterContext_1.useFilter)();
    const query = (0, react_router_dom_1.useParams)();
    //Slugs only
    const [popularPosts, setPopularPosts] = (0, react_1.useState)([]);
    const [pagePosts, setPagePosts] = (0, react_1.useState)([]);
    const [postsOpen, setPostsOpen] = (0, react_1.useState)([]);
    //Data
    const [postsData, setPostsData] = (0, react_1.useState)([]);
    //Caches full post data (including comments and body)
    const cachePostData = (slug, force) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const found = postsData.find((p) => p.slug === slug);
            if (found && !force)
                return;
            const p = yield (0, posts_1.getPost)(slug);
            cacheUserData(p.author.id);
            addToPostsData([p]);
        }
        catch (e) {
            console.warn("Could not cache data for post " + slug);
            setErr(`${e}`);
        }
    });
    const [status, setStatus] = (0, react_1.useState)("idle");
    const [error, setError] = (0, react_1.useState)("");
    const addToPostsData = (data) => {
        data.forEach((p) => cacheUserData(p === null || p === void 0 ? void 0 : p.author.id));
        setPostsData((old) => [
            ...old.filter((p) => !data.find((pd) => p.id === pd.id)),
            ...data,
        ]);
    };
    const getAndSetPage = () => {
        const queryPortion = (window.location.href.split("/blog/")[1] || "").split("?")[1] || "";
        (0, posts_1.getPage)(`${query.page ? Number(query.page) : 1}${queryPortion ? `?${queryPortion}` : ""}`)
            .then((data) => {
            addToPostsData(data.posts);
            setPagePosts((p) => [...data.posts.map((p) => p.slug)]);
            setStatus("success");
            setMaxPage(data.maxPage);
            setPageCount(data.pageCount);
            setFullCount(data.fullCount);
        })
            .catch((e) => {
            setError(`${e}`);
            setStatus("error");
        });
    };
    const handleGetAndSetPage = (0, react_1.useMemo)(() => 
    // the way this is set up is probably not good, should have implemented debouncing earlier on
    (0, lodash_1.debounce)(() => {
        getAndSetPage();
    }, 300), [searchTags, searchTerm, query.page]);
    (0, react_1.useEffect)(() => {
        if (!query.page)
            return;
        handleGetAndSetPage();
        setStatus("pending-search");
    }, [searchTags, searchTerm, query.page, sortOrderIndex, sortModeIndex]);
    const [err, setErr] = (0, react_1.useState)("");
    (0, react_1.useEffect)(() => {
        setStatus("pending");
        getAndSetPage();
        (0, posts_1.getPopularPosts)()
            .then((posts) => {
            const slugs = posts.map((p) => p.slug);
            slugs.forEach((slug) => postEnteredView(slug));
            addToPostsData(posts);
            setPopularPosts(slugs);
        })
            .catch((e) => setErr(`Error getting popular posts : ${e}`));
    }, []);
    const openPost = (slug) => {
        socket === null || socket === void 0 ? void 0 : socket.emit("open_post", slug);
        setPostsOpen((p) => [...p.filter((checkSlug) => checkSlug !== slug), slug]);
        cachePostData(slug, true);
    };
    const closePost = (slug) => {
        socket === null || socket === void 0 ? void 0 : socket.emit("leave_post", slug);
        setPostsOpen((p) => [...p.filter((checkSlug) => checkSlug !== slug)]);
    };
    const likePost = (id) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { addLike } = yield (0, posts_1.toggleLike)(id);
            setPostsData((p) => {
                let newPosts = p;
                const i = newPosts.findIndex((p) => p.id === id);
                newPosts[i] = Object.assign(Object.assign({}, newPosts[i]), { likedByMe: !newPosts[i].likedByMe, likes: newPosts[i].likes + (addLike ? 1 : -1) });
                return [...newPosts];
            });
        }
        catch (e) {
            setErr(`${e}`);
        }
    });
    const sharePost = (id) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { addShare } = yield (0, posts_1.toggleShare)(id);
            setPostsData((p) => {
                let newPosts = p;
                const i = newPosts.findIndex((p) => p.id === id);
                newPosts[i] = Object.assign(Object.assign({}, newPosts[i]), { sharedByMe: !newPosts[i].sharedByMe, shares: newPosts[i].shares + (addShare ? 1 : -1) });
                return [...newPosts];
            });
        }
        catch (e) {
            setErr(`${e}`);
        }
    });
    const getPostData = (0, react_1.useCallback)((slug) => postsData.find((p) => p.slug === slug), [postsData]);
    const [visiblePosts, setVisiblePosts] = (0, react_1.useState)([]);
    const [disappearedPosts, setDisappearedPosts] = (0, react_1.useState)([]);
    const subscribeToPost = (0, react_1.useCallback)((slug) => {
        if (!socket)
            return;
        socket === null || socket === void 0 ? void 0 : socket.emit("post_card_visible", slug);
    }, [socket]);
    const unsubscribeFromPost = (0, react_1.useCallback)((slug) => {
        if (!socket)
            return;
        socket === null || socket === void 0 ? void 0 : socket.emit("post_card_not_visible", slug);
    }, [socket]);
    const postEnteredView = (slug) => {
        setVisiblePosts((p) => [...p, slug]);
        setDisappearedPosts((p) => [...p.filter((p) => p.slug !== slug)]);
        subscribeToPost(slug);
    };
    const postLeftView = (slug) => {
        const visibleCount = visiblePosts.filter((visibleSlug) => visibleSlug === slug).length - 1;
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
        }
        else {
            setVisiblePosts((p) => {
                //instead of removing all matching slugs, remove only one, because we need to retain the duplicates
                let newVisiblePosts = p;
                newVisiblePosts.splice(p.findIndex((vslug) => vslug === slug), 1);
                return [...newVisiblePosts];
            });
        }
    };
    (0, react_1.useEffect)(() => {
        const i = setInterval(() => {
            const postsDisappeared30SecondsAgo = disappearedPosts
                .filter((dp) => new Date().getTime() - dp.disappearedAt.getTime() > 30000)
                .map((dp) => dp.slug);
            setPostsData((p) => [
                ...p.filter((pd) => !postsDisappeared30SecondsAgo.includes(pd.slug)),
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
    const handleVisiblePostUpdate = (data) => {
        setPostsData((p) => {
            let newPosts = p;
            const foundIndex = p.findIndex((p) => p.slug === data.slug);
            if (foundIndex === -1 || !newPosts[foundIndex])
                return;
            newPosts[foundIndex] = Object.assign(Object.assign({}, newPosts[foundIndex]), data);
            return newPosts;
        });
    };
    const handleVisiblePostCommentUpdate = (addComment, slug) => {
        setPostsData((p) => {
            let newPosts = p;
            const foundIndex = p.findIndex((p) => p.slug === slug);
            if (foundIndex === -1 || !newPosts[foundIndex])
                return;
            newPosts[foundIndex] = Object.assign(Object.assign({}, newPosts[foundIndex]), { commentCount: newPosts[foundIndex].commentCount + (addComment ? 1 : -1) });
            return newPosts;
        });
    };
    const handleVisiblePostLikeUpdate = (addLike, sid, postId) => {
        if (sid === (socket === null || socket === void 0 ? void 0 : socket.id))
            return;
        //@ts-ignore
        setPostsData((p) => {
            let newPosts = p;
            const foundIndex = p.findIndex((p) => p.id === postId);
            if (foundIndex === -1 || !newPosts[foundIndex])
                return;
            newPosts[foundIndex] = Object.assign(Object.assign({}, newPosts[foundIndex]), { likes: newPosts[foundIndex].likes + (addLike ? 1 : -1) });
            return [...newPosts];
        });
    };
    const handleVisiblePostShareUpdate = (addShare, sid, postId) => {
        if (sid === (socket === null || socket === void 0 ? void 0 : socket.id))
            return;
        //@ts-ignore
        setPostsData((p) => {
            let newPosts = p;
            const foundIndex = p.findIndex((p) => p.id === postId);
            if (foundIndex === -1 || !newPosts[foundIndex])
                return;
            newPosts[foundIndex] = Object.assign(Object.assign({}, newPosts[foundIndex]), { shares: newPosts[foundIndex].shares + (addShare ? 1 : -1) });
            return [...newPosts];
        });
    };
    (0, react_1.useEffect)(() => {
        if (!socket)
            return;
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
    return ((0, jsx_runtime_1.jsx)(PostsContext.Provider, Object.assign({ value: {
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
        } }, { children: children })));
};
exports.PostsProvider = PostsProvider;
const usePosts = () => (0, react_1.useContext)(PostsContext);
exports.usePosts = usePosts;
