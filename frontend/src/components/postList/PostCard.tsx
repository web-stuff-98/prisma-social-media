import { useNavigate } from "react-router-dom";
import { IPost, usePosts } from "../../context/PostsContext";
import useUsers from "../../context/UsersContext";
import User from "../User";

export default function PostCard({
  post,
}: {
  post: IPost;
}) {
  const navigate = useNavigate();
  const { getUserData } = useUsers();
  const { likePost, sharePost } = usePosts()

  return (
    <article
      className="bg-foreground border dark:border-stone-800 shadow-lg dark:bg-darkmodeForeground pointer text-center rounded p-6"
    >
      <h3 className="text-2xl font-bold leading-5">{post.title}</h3>
      <p className="mb-1 leading-4 tracking-tight">
        {post.description}
      </p>
      <div
        aria-label="Tags"
        className="flex gap-1 w-full flex-wrap items-center justify-center my-1 mb-4"
      >
        {post.tags.map((tag) => (
          <span key={tag} className="bg-zinc-500 cursor-pointer shadow-md border border-black dark:border-zinc-600 text-white rounded font-bold text-xs px-1">
            {tag}
          </span>
        ))}
      </div>
      <span className="mx-auto w-fit">
        <User
          likeShareIcons
          liked={post.likedByMe}
          likes={post.likes}
          shared={post.sharedByMe}
          shares={post.shares}
          date={new Date(String(post.createdAt))}
          onLikeClick={() => likePost(post.id)}
          onShareClick={() => sharePost(post.id)}
          by
          uid={String(post.author.id)}
          user={getUserData(String(post.author.id))}
        />
      </span>
      <span
        onClick={() => navigate(`/posts/${post.slug}`)}
        className="italic text-xs cursor-pointer"
      >
        Read more...
      </span>
    </article>
  );
}
