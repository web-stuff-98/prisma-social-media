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
    <article className="bg-white pointer text-center rounded shadow">
      <h1 className="text-2xl font-bold">{post.title}</h1>
      <p className="mb-1">{post.description}</p>
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
