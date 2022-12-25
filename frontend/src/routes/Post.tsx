import { useEffect, useState, useRef } from "react";
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
import { useSocket } from "../context/SocketContext";
import { useInterface } from "../context/InterfaceContext";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
  timeStyle: "short",
});

export default function Post() {
  const { socket } = useSocket();
  const { rootComments, createLocalComment } = usePost();
  const {
    getPostData,
    likePost,
    sharePost,
    openPost,
    closePost,
    postEnteredView,
    postLeftView,
  } = usePosts();
  const { getUserData } = useUsers();
  const { openModal } = useModal();
  const { slug } = useParams();
  const { user } = useAuth();
  const { state: iState } = useInterface();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const post = getPostData(String(slug));

  useEffect(() => {
    if (!socket) return;
    socket.on("post_visible_deleted", (delSlug) => {
      if (delSlug === slug) {
        openModal("Message", {
          msg: "The post you were reading was deleted.",
          err: false,
          pen: false,
        });
        navigate("/blog/1");
      }
    });
  }, [socket]);

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
      postEnteredView(slug);
    }
    return () => {
      closePost(slug!);
      postLeftView(slug!);
    };
  }, [slug]);

  const getDateString = (date:Date) => dateFormatter.format(date)
  const renderUpdatedAt = (dateString:string) => `updated ${dateString.split(", ")[0]} at ${dateString.split(", ")[1]}`

  const { scrollY } = useScrollY();

  return (
    <div ref={containerRef} className="w-full">
      {post ? (
        <>
          <div
            style={{
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundImage: `url(https://d2gt89ey9qb5n6.cloudfront.net/${(process.env.NODE_ENV !== "production" ? "dev." : "") + post?.imageKey})`,
              backgroundPositionY: `calc(50% + ${scrollY * 0.5}px)`,
            }}
            className="w-full h-72 flex overflow-hidden text-white flex-col justify-end"
          >
            <div
              style={{
                backdropFilter: "blur(2px)",
                background: "rgba(0,0,0,0.166)",
                borderTop: "1px outset rgba(255,255,255,0.1)",
              }}
              className="md:flex md:flex-row sm:flex sm:flex-col sm:justify-center p-2 dark:border-stone-800 drop-shadow-lg items-end pb-2"
            >
              <h1
                style={{ textShadow: "0px 3px 4.5px black" }}
                className="md:text-4xl sm:text-md font-bold grow mr-4"
              >
                {post?.title}
                {post.updatedAt && post.updatedAt !== post.createdAt && <><br className="my-0 leading-3 py-0"/><b className="font-normal text-xs my-0">{renderUpdatedAt(getDateString(new Date(post.updatedAt)))}</b></>}
              </h1>
              <div className="my-2 drop-shadow-xl flex flex-col md:justify-end items-end sm:justify-center w-fit">
                <User
                  style={{ textShadow: "0px 3px 4.5px black" }}
                  uid={String(post?.author!.id)}
                  likeShareIcons
                  liked={post?.likedByMe}
                  likes={post?.likes}
                  shared={post?.sharedByMe}
                  shares={post?.shares}
                  onLikeClick={() => likePost(String(post?.id))}
                  onShareClick={() => sharePost(String(post?.id))}
                  date={post?.createdAt ? new Date(post.createdAt) : undefined}
                  by
                  user={getUserData(String(post?.author!.id))}
                  reverse={iState.breakPoint !== "sm"}
                  fixDarkBackgroundContrast
                />
                {user && post?.author!.id === user?.id && (
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
                            deletePost(post.slug!)
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
            <ReactMarkdown>{post?.body!}</ReactMarkdown>
          </div>
          <section className="w-full p-2 mt-6">
            {
              <div className="mx-auto py-0.5 text-xs text-center">
                {!post.commentCount
                  ? "No comments"
                  : `${post.commentCount} comment${
                      post.commentCount! > 1 && "s"
                    }`}
              </div>
            }
            {user && (
              <CommentForm
                placeholder="Add a comment..."
                loading={false}
                error={commentError}
                onSubmit={postComment}
              />
            )}
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
        </>
      ) : (
        <></>
      )}
    </div>
  );
}
