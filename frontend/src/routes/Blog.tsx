import { useRef, useEffect } from "react";
import { useScrollToTop } from "../components/layout/Layout";
import PostCard from "../components/postList/PostCard";
import { useInterface } from "../context/InterfaceContext";
import { IPost, usePosts } from "../context/PostsContext";
import { useFilter } from "../context/FilterContext";
import Tag from "../components/postList/Tag";
import { ImSpinner8 } from "react-icons/im";
import useScrollbarSize from "react-scrollbar-size";

export default function Blog() {
  const { pagePosts, getPostData, status } = usePosts();
  const { searchTags } = useFilter();
  const { state: iState } = useInterface();
  const { width: scrollWidth } = useScrollbarSize()
  const postsContainerRef = useRef<HTMLDivElement>(null);
  const scrollToTop = useScrollToTop();

  useEffect(() => {
    scrollToTop();
  }, [pagePosts]);

  return (
    <div
      className={`w-full h-full relative flex gap-3 ${
        iState.breakPoint === "sm" ? "p-1" : "p-3"
      }`}
    >
      {
        /* Selected tags container */
        searchTags.length > 0 && (
          <span
            style={{
              position: "fixed",
              top: "6.5rem",
              left: "0",
              background: iState.darkMode ? "rgba(0,0,0,0.333)":"rgba(0,0,0,0.75)",
              backdropFilter: "blur(2px)",
              borderBottom: "1px solid rgba(255,255,255,0.166)",
              zIndex: "97",
              width: `calc(100vw - ${scrollWidth}px)`
            }}
            className="w-full flex p-2 items-center justify-center h-fit shadow-xl bg-gray-500"
          >
            <div
              style={{ filter: "drop-shadow(0px 1.5px 1px rgba(0,0,0,0.5))" }}
              className="flex flex-wrap justify-center py-1 gap-0.5"
            >
              {searchTags.map((tag: string) => (
                <Tag isSearchTag key={tag} tag={tag} />
              ))}
            </div>
          </span>
        )
      }
      <div ref={postsContainerRef} className="flex flex-col grow gap-3">
        {status === "pending" && (
          <ImSpinner8 className="text-4xl mx-auto animate-spin" />
        )}
        {pagePosts &&
          status !== "pending" &&
          pagePosts.length > 0 &&
          pagePosts.map((slug, i) => (
            <PostCard
              reverse={Boolean(i % 2)}
              key={slug}
              post={{ ...{ slug }, ...getPostData(slug) } as IPost}
            />
          ))}
        <span style={{ minHeight: "5rem" }} />
      </div>
    </div>
  );
}
