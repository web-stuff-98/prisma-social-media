import ReactMarkdown from "react-markdown";
import { Comment } from "../components/comments/Comment";
import { CommentForm } from "../components/comments/CommentForm";
import User from "../components/User";
import { usePost } from "../context/PostContext";
import useUsers from "../context/UsersContext";
import { createComment } from "../services/comments";

export default function Post() {
  const {
    post,
    rootComments,
    createLocalComment,
    handleLikeClicked,
    handleShareClicked,
  } = usePost();

  const { getUserData } = useUsers()

  const postComment = (message: string) =>
    createComment({ postId: String(post?.id), message }).then(
      createLocalComment
    );

  return (
    <>
      <h1 className="text-4xl my-4 text-left font-bold">{post?.title}</h1>
      <div className="flex border-b items-center py-2 my-2">
        <p className="text-lg leading-5 mr-4">{post?.description}</p>
        <div className="my-2 w-fit">
          <User
          uid={String(post?.author.id)}
            likeShareIcons
            liked={post?.likedByMe}
            shared={post?.sharedByMe}
            onLikeClick={handleLikeClicked}
            onShareClick={handleShareClicked}
            date={new Date(String(post?.createdAt))}
            by
            user={getUserData(String(post?.author.id))}
            reverse
          />
        </div>
      </div>
      <div className="prose prose-sm max-w-none">
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
