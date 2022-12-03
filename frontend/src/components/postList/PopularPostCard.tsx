import { IPost } from "../../context/PostsContext";

export default function PopularPostCard(post?: IPost) {
  return (
    <article key={post!.slug} className="leading-5 py-1 my-1 mb-4 rounded-sm">
      {post ? (
        <>
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
        </>
      ) : (
        <></>
      )}
    </article>
  );
}
