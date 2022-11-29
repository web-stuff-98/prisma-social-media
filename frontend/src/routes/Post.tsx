import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";
import { Comment } from "../components/comments/Comment";
import { CommentForm } from "../components/comments/CommentForm";
import User from "../components/User";
import { usePost } from "../context/PostContext";
import { usePosts } from "../context/PostsContext";
import useUsers from "../context/UsersContext";
import { createComment } from "../services/comments";

export default function Post() {
  const { rootComments, createLocalComment } = usePost();

  const { getPostData, likePost, sharePost, openPost, closePost } = usePosts();
  const { getUserData } = useUsers();
  const { slug } = useParams();

  const post = getPostData(String(slug));


  const postComment = (message: string) =>
    createComment({ postId: String(post?.id), message }).then(
      createLocalComment
    );

  useEffect(() => {
    if (slug) {
      openPost(slug);
    }
    return () => {
      closePost(String(slug));
    };
  }, [slug]);

  return (
    <div className="w-full px-2 py-2">
      <div className="flex dark:border-stone-800 items-center pb-2 my-2">
        <h1 className="text-4xl font-bold mr-4">{post?.title}</h1>
        <div className="my-2 w-fit">
          <User
            uid={String(post?.author.id)}
            likeShareIcons
            liked={post?.likedByMe}
            likes={post?.likes}
            shared={post?.sharedByMe}
            shares={post?.shares}
            onLikeClick={() => likePost(String(post?.id))}
            onShareClick={() => sharePost(String(post?.id))}
            date={post?.createdAt ? new Date(post.createdAt) : undefined}
            by
            user={getUserData(String(post?.author.id))}
            reverse
          />
        </div>
      </div>
      <div
        className="prose prose-sm
                  dark:prose-headings:text-white
                  dark:prose-headings:font-bold
                  dark:prose-lead:text-white
                  dark:prose-p:text-white
                  dark:prose-blockquote:text-white
                  dark:prose-li:text-white
                  dark:prose-strong:text-white
                  dark:prose-figure:text-white
                  dark:prose-figcaption:text-white
                  dark:prose-table:text-white
                  dark:prose-tr:text-white
                  dark:prose-th:text-white
                  dark:prose-td:text-white
                  prose-a:text-indigo-500
                  prose-a:font-bold
      max-w-none"
      >
        <ReactMarkdown>{String(post?.body)}</ReactMarkdown>
      </div>
      <section className="w-full mt-6">
        <CommentForm
          placeholder="Add a comment..."
          loading={false}
          error={""}
          onSubmit={postComment}
        />
        {rootComments != null && rootComments.length > 0 && (
          <div className="mt-4 pb-1 w-full">
            {rootComments.map((comment) => (
              <div key={comment.id} className="w-full h-full">
                <Comment {...comment} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
