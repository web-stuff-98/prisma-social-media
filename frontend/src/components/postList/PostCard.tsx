import { useNavigate } from "react-router-dom";
import { IPost } from "../../context/PostContext";
import User from "../User";

export default function PostCard({ post }: { post: IPost }) {
  const navigate = useNavigate();

  return (
    <article
      onClick={() => navigate(`/posts/${post.slug}`)}
      className="bg-gray-100 pointer text-center rounded shadow"
    >
      <h1 className="text-2xl font-bold my-3">{post.title}</h1>
      <div className="mx-auto w-fit p-2">
        <User date={new Date(String(post.createdAt))} by user={post.author} />
      </div>
      <p>{post.description}</p>
    </article>
  );
}
