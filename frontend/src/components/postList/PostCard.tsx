import { useNavigate } from "react-router-dom";
import { IPost } from "../../context/PostContext";
import useUsers from "../../context/UsersContext";
import User from "../User";

export default function PostCard({
  post,
  handleToggleLike,
  handleToggleShare,
}: {
  post: IPost;
  handleToggleLike: (postId: string) => void;
  handleToggleShare: (postId: string) => void;
}) {
  const navigate = useNavigate();
  const { getUserData } = useUsers();

  const handleLikeIconClicked = () => handleToggleLike(post.id);
  const handleShareIconClicked = () => handleToggleShare(post.id);

  return (
    <article className="bg-white pointer text-center rounded-sm shadow-md border">
      <h3 className="text-2xl font-bold">{post.title}</h3>
      <p className="mb-1">{post.description}</p>
      <div aria-label="Tags" className="flex gap-2 w-full wrap items-center justify-center my-2">
        {post.tags.map((tag) => (
          <span className="bg-stone-800 cursor-pointer shadow-md border border-black border-black text-white rounded-sm uppercase font-bold text-xs px-2 py-0.5">
            {tag}
          </span>
        ))}
      </div>
      <span className="mx-auto w-fit">
        <User
          likeShareIcons
          liked={post.likedByMe}
          shared={post.sharedByMe}
          date={new Date(String(post.createdAt))}
          onLikeClick={handleLikeIconClicked}
          onShareClick={handleShareIconClicked}
          by
          uid={String(post.author.id)}
          user={getUserData(String(post.author.id))}
        />
      </span>
      <span
        onClick={() => navigate(`/posts/${post.slug}`)}
        className="italic text-xs py-2 cursor-pointer"
      >
        Read more...
      </span>
    </article>
  );
}
