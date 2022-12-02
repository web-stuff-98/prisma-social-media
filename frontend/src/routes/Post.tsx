import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate, useParams } from "react-router-dom";
import { Comment } from "../components/comments/Comment";
import { CommentForm } from "../components/comments/CommentForm";
import { IconBtn } from "../components/IconBtn";
import User from "../components/User";
import { usePost } from "../context/PostContext";
import { usePosts } from "../context/PostsContext";
import useUsers from "../context/UsersContext";
import { createComment } from "../services/comments";

import { RiEditBoxFill, RiDeleteBin4Fill } from "react-icons/ri";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { deletePost } from "../services/posts";
import { useScrollY } from "../components/layout/Layout";

export default function Post() {
  const { rootComments, createLocalComment } = usePost();
  const { getPostData, likePost, sharePost, openPost, closePost } = usePosts();
  const { getUserData } = useUsers();
  const { openModal } = useModal();
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const post = getPostData(String(slug));

  const [commentError, setCommentError] = useState("");
  const postComment = (message: string) =>
    createComment({ postId: String(post?.id), message })
      .then((data) => {
        createLocalComment(data);
        setCommentError("");
      })
      .catch((e) => setCommentError(`${e}`));

  useEffect(() => {
    if (slug) {
      openPost(slug);
    }
    return () => {
      closePost(String(slug));
    };
  }, [slug]);

  const { scrollY } = useScrollY()

  return (
    <div className="w-full">
      <div
        style={{
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundImage: `url(https://d2gt89ey9qb5n6.cloudfront.net/${post?.imageKey})`,
          backgroundPositionY:`calc(50% + ${scrollY * 0.5}px)`
        }}
        className="w-full h-72 flex overflow-hidden text-white rounded flex-col justify-end mt-2"
      >
        <div style={{backdropFilter:"blur(2px)", background:"rgba(0,0,0,0.1)", border:"1px outset rgba(255,255,255,0.1)"}} className="flex p-2 dark:border-stone-800 drop-shadow-lg items-end pb-2">
          <h1 style={{textShadow:"0px 3px 4.5px black"}} className="md:text-4xl sm:text-2xl font-bold grow mr-4">{post?.title}</h1>
          <div className="my-2 drop-shadow-xl flex flex-col justify-end items-end w-fit">
            <User
            style={{textShadow:"0px 3px 4.5px black"}}
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
            {user && post?.author.id === user?.id && (
              <div className="flex gap-1 my-2">
                <IconBtn
                  aria-label="Edit post"
                  onClick={() => navigate(`/editor/${post.slug}`)}
                  Icon={RiEditBoxFill}
                />
                <IconBtn
                  onClick={() => {
                    openModal("Confirm", {
                      pen: false,
                      err: false,
                      msg: `Are you sure you want to delete ${post.title}?`,
                      confirmationCallback: () => {
                        navigate("/blog/1");
                        openModal("Message", {
                          err: false,
                          pen: true,
                          msg: "Deleting post...",
                        });
                        deletePost(post.slug)
                          .then(() => {
                            openModal("Message", {
                              err: false,
                              pen: false,
                              msg: "Deleted post",
                            });
                          })
                          .catch((e) => {
                            openModal("Message", {
                              err: true,
                              pen: false,
                              msg: `${e}`,
                            });
                          });
                      },
                    });
                  }}
                  Icon={RiDeleteBin4Fill}
                  aria-label="Delete"
                  color="text-rose-600"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className="p-2 prose prose-sm
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
      <section className="w-full p-2 mt-6">
        <CommentForm
          placeholder="Add a comment..."
          loading={false}
          error={commentError}
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
