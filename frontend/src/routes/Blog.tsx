import { useRef, useEffect } from "react";
import { useScrollToTop, useScrollY } from "../components/layout/Layout";
import PopularPostCard from "../components/postList/PopularPostCard";
import PostCard from "../components/postList/PostCard";
import { IPost, usePosts } from "../context/PostsContext";

export default function Blog() {
  const { pagePosts, popularPosts, getPostData } = usePosts();
  const { scrollY } = useScrollY();
  const scrollToTop = useScrollToTop();
  const postsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToTop();
  }, [pagePosts]);

  return (
    <div className="w-full h-full flex gap-3 p-3">
      <div ref={postsContainerRef} className="flex flex-col grow gap-3">
        {pagePosts &&
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
      {
        <div
          style={{
            maxHeight: "calc(100% - 11.5rem)",
            top: `${scrollY}px`,
            maxWidth: "10pc",
          }}
          className="relative bg-foreground overflow-y-auto border border-stone-200 dark:border-stone-800 shadow dark:bg-darkmodeForeground pointer text-center rounded p-2"
        >
          <h2 className="whitespace-nowrap font-extrabold tracking-tight text-md">
            Popular posts
          </h2>
          <aside
            style={{ maxWidth: "25pc" }}
            className="flex flex-col items-center justify-center"
          >
            {popularPosts &&
              popularPosts.length > 0 &&
              popularPosts.map((slug) =>
                PopularPostCard({
                  ...{ slug },
                  ...getPostData(slug),
                } as IPost)
              )}
          </aside>
        </div>
      }
    </div>
  );
}
