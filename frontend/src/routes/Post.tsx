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

  const { getUserData } = useUsers();

  const postComment = (message: string) =>
    createComment({ postId: String(post?.id), message }).then(
      createLocalComment
    );

  return (
    <>
      <h1 className="text-4xl mt-4 text-center font-bold">{post?.title}</h1>
      <div className="flex dark:border-stone-800 items-center pb-2 my-2">
        <p className="text-lg leading-5 font-bold mr-4">{post?.description}</p>
        <div className="my-2 w-fit">
          <User
            uid={String(post?.author.id)}
            likeShareIcons
            liked={post?.likedByMe}
            likes={post?.likes}
            shared={post?.sharedByMe}
            shares={post?.shares}
            onLikeClick={handleLikeClicked}
            onShareClick={handleShareClicked}
            date={new Date(String(post?.createdAt))}
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
