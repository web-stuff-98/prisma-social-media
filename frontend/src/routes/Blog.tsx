import { useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import { useScrollToTop } from "../components/layout/Layout";
import PopularPostCard from "../components/postList/PopularPostCard";
import PostCard from "../components/postList/PostCard";
import { useInterface } from "../context/InterfaceContext";
import { IPost, usePosts } from "../context/PostsContext";

import { IoSearch } from "react-icons/io5";
import { IconBtn } from "../components/IconBtn";
import { useFilter } from "../context/FilterContext";
import Tag from "../components/postList/Tag";
import { ImSpinner8 } from "react-icons/im";
import useScrollbarWidth from "../hooks/useElementScrollbarWidth";

export default function Blog() {
  const { pagePosts, popularPosts, getPostData, status } = usePosts();
  const { searchTags, setSearchTerm, searchTerm } = useFilter();
  const { state: iState } = useInterface();
  const scrollToTop = useScrollToTop();
  const width = useScrollbarWidth();
  const postsContainerRef = useRef<HTMLDivElement>(null);

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
      {false && (
        <div
          style={{
            width: `10rem`,
            height: "calc(100% - 13rem)",
            top: "7.25rem",
            right: `calc((100% - ${postsContainerRef.current
              ?.clientWidth!}px) / 2)`,
          }}
          className="fixed bg-foreground overflow-y-auto overflow-x-hidden border border-stone-200 dark:border-stone-800 shadow dark:bg-darkmodeForeground pointer text-center rounded p-2"
        >
          <form className="flex items-center gap-1">
            <input
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              placeholder="Search posts..."
              type="text"
              style={{ width: `calc(7.5rem - ${width || 0}px)` }}
              className="px-1"
            />
            <IconBtn
              aria-label="Submit search query"
              Icon={status === "pending-search" ? ImSpinner8 : IoSearch}
              color={`${
                status === "pending-search" ? "animate-spin" : ""
              } text-xl`}
            />
          </form>
          {searchTags && (
            <div
              style={{ filter: "drop-shadow(0px 1.5px 1px rgba(0,0,0,0.5))" }}
              className="flex flex-wrap justify-center py-1 gap-0.5"
            >
              {searchTags.map((tag: string) => (
                <Tag isSearchTag key={tag} tag={tag} />
              ))}
            </div>
          )}
          <h2 className="whitespace-nowrap font-extrabold tracking-tight text-md">
            Popular posts
          </h2>
          <aside className="flex flex-col items-center justify-center">
            {popularPosts &&
              popularPosts.length > 0 &&
              popularPosts.map((slug) =>
                PopularPostCard(getPostData(slug) as IPost)
              )}
          </aside>
        </div>
      )}
    </div>
  );
}
