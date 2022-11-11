import { Comment } from "../components/comments/Comment";
import { CommentForm } from "../components/comments/CommentForm";
import User from "../components/User";
import { usePost } from "../context/PostContext";
import { createComment } from "../services/comments";

export default function Post() {
  const { post, rootComments, createLocalComment } = usePost();

  const postComment = (message: string) =>
    createComment({ postId: String(post?.id), message }).then(
      createLocalComment
    );

  return (
    <>
      <h1 className="text-4xl text-center py-3 font-bold">{post?.title}</h1>
      <div className="mx-auto mt-4 mb-6 w-fit">
        <User date={new Date(String(post?.createdAt))} by user={post?.author} />
      </div>
      <p className="leading-5 text-center">{post?.body}</p>
      <section className="w-full mt-6">
        <CommentForm
          placeholder="Add a comment..."
          loading={false}
          error={""}
          onSubmit={postComment}
        />
        {rootComments != null && rootComments.length > 0 && (
          <div className="mt-4 w-full">
            {rootComments.map((comment) => (
              <div key={comment.id} className="w-full h-full">
                <Comment {...comment} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
