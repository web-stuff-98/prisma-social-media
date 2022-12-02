import { useScrollY } from "../components/layout/Layout";
import PostCard from "../components/postList/PostCard";
import User from "../components/User";
import { IPost, usePosts } from "../context/PostsContext";

import useUsers from "../context/UsersContext";

export default function Blog() {
  const { getUserData } = useUsers();
  const { posts, popularPosts, getPostData, likePost, sharePost } = usePosts();

  const renderPopularPost = (post?: IPost) => {
    return (
      <>
        {post ? (
          <article
            key={post.id}
            className="leading-5 py-1 my-1 mb-4 rounded-sm"
          >
            <h2 className="text-xs leading-3 my-0 mb-0.5 py-0.5">
              {post.title}
              <br />
              <a
                href={`/posts/${post.slug}`}
                className="font-bold text-xs italic cursor-pointer"
              >
                Read more
              </a>
            </h2>
            <User
              likeShareIcons
              likes={post.likes}
              shares={post.shares}
              liked={post.likedByMe}
              shared={post.sharedByMe}
              uid={post.author.id}
              onLikeClick={() => likePost(post.id)}
              onShareClick={() => sharePost(post.id)}
              user={getUserData(post.author.id)}
            />
          </article>
        ) : (
          <></>
        )}
      </>
    );
  };

  const { scrollY } = useScrollY();

  return (
    <div className="w-full h-full flex gap-3 p-3">
      <div className="flex flex-col grow gap-3">
        {posts &&
          posts.length > 0 &&
          posts.map((post, i) => (
            <PostCard reverse={Boolean(i % 2)} key={post.id} post={post} />
          ))}
        <span style={{ minHeight: "5rem" }} />
      </div>
      <div
        style={{
          maxHeight: "calc(100% - 11.5rem)",
          top: `${scrollY}px`,
          transition: "top 100ms linear",
        }}
        className="relative bg-foreground overflow-y-auto border dark:border-stone-800 shadow-lg dark:bg-darkmodeForeground pointer text-center rounded p-2"
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
            popularPosts.map((postSlug) =>
              renderPopularPost(getPostData(postSlug))
            )}
        </aside>
      </div>
    </div>
  );
}
