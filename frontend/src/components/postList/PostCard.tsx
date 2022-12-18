import { Link, useNavigate } from "react-router-dom";
import { useFilter } from "../../context/FilterContext";
import { IPost, usePosts } from "../../context/PostsContext";
import useUsers from "../../context/UsersContext";
import User from "../User";
import { RiEditBoxFill, RiDeleteBin4Fill } from "react-icons/ri";
import { IconBtn } from "../IconBtn";
import { useAuth } from "../../context/AuthContext";
import { useState, useLayoutEffect, useRef } from "react";
import { useModal } from "../../context/ModalContext";
import { deletePost } from "../../services/posts";
import { useInterface } from "../../context/InterfaceContext";
import Tag from "./Tag";

export default function PostCard({
  post,
  reverse = false,
}: {
  post?: IPost;
  reverse: boolean;
}) {
  const navigate = useNavigate();
  const { getUserData } = useUsers();
  const { likePost, sharePost, postEnteredView, postLeftView } = usePosts();
  const { openModal } = useModal();
  const { state: iState } = useInterface();
  const { user } = useAuth();
  const { searchTags, autoAddRemoveSearchTag } = useFilter();

  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });
  useLayoutEffect(() => {
    if (post!.slug) postEnteredView(post!.slug);
    observer.observe(containerRef.current!);
    return () => {
      if (post!.slug) postLeftView(post!.slug);
      observer.disconnect();
    };
    //putting the ref in the dependency array was the only way to get this working properly for some reason
  }, [containerRef.current]);

  return (
    <article
      ref={containerRef}
      className={`p-2 md:pl-2 bg-foreground dark:bg-darkmodeForeground shadow rounded border-stone-200 border dark:border-stone-800 text-center md:h-postHeight gap-1 sm:flex-col md:flex ${
        reverse ? "md:flex-row-reverse" : "md:flex-row"
      } h-full w-full justify-evenly`}
    >
      {post?.author ? (
        <>
          <div
            style={{
              backgroundImage: `url(${post.blur})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              ...(iState.breakPoint === "sm" ? { height: "256px" } : {}),
            }}
            className="relative border border-zinc-700 shadow-md sm:w-full sm:h-28 md:w-64 md:min-w-postWidth md:max-w-postWidth md:h-postImageHeight bg-gray-200 shadow rounded overflow-hidden shadow"
          >
            {visible && (
              <Link to={`/posts/${post.slug}`}>
                <img
                  style={{
                    background: "transparent",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                  className="cursor-pointer"
                  src={`https://d2gt89ey9qb5n6.cloudfront.net/thumb.${post.imageKey}`}
                />
              </Link>
            )}
            {user && post.author.id === user.id && (
              <div
                style={{
                  bottom: "0",
                  left: "0",
                  background: "rgba(0,0,0,0.333)",
                  backdropFilter: "blur(2px)",
                }}
                className="w-full flex justify-center gap-2 p-1 drop-shadow-lg absolute"
              >
                <IconBtn
                  onClick={() => navigate(`/editor/${post.slug}`)}
                  Icon={RiEditBoxFill}
                  color="text-white"
                />
                <IconBtn
                  onClick={() =>
                    openModal("Confirm", {
                      pen: false,
                      err: false,
                      msg: `Are you sure you want to delete ${post.title}?`,
                      confirmationCallback: () => {
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
                    })
                  }
                  Icon={RiDeleteBin4Fill}
                  aria-label="Delete"
                  color="text-rose-600"
                />
              </div>
            )}
          </div>
          <div
            className={`flex flex-col my-auto h-fit justify-center items-${
              iState.breakPoint !== "sm" ? (reverse ? "end" : "start") : "center"
            } mx-auto grow p-1`}
          >
            <h3
              style={{ lineHeight: "0.9" }}
              className={`font-Archivo tracking-tight sm:text-sm md:text-lg sm:mx-auto md:mx-0 sm:py-0 pt-0 mb-0.5 sm:text-center ${
                reverse ? "md:text-right" : "md:text-left"
              }`}
            >
              {post.title}
            </h3>
            <p
              style={{ lineHeight: "0.95" }}
              className={`sm:text-center px-0 sm:text-xs py-0.5 mb-0.5 sm:mx-auto md:mx-0 text-xs ${
                reverse ? "md:text-right" : "md:text-left"
              }`}
            >
              {post.description}
            </p>
            <div
              aria-label="Tags"
              style={{ filter: "drop-shadow(0px 1.5px 1px rgba(0,0,0,0.5))" }}
              className={`flex py-0.5 flex-wrap ${
                iState.breakPoint === "sm" ? "justify-center" : ""
              } ${
                reverse ? "md:justify-end" : "md:justify-start"
              } w-full gap-0.5`}
            >
              {post.tags.map((tag) => (
                <Tag key={tag} tag={tag} />
              ))}
            </div>
            <span className="sm:mx-auto mt-1 md:mx-0">
              <User
                likeShareIcons
                liked={post.likedByMe}
                likes={post.likes}
                shared={post.sharedByMe}
                shares={post.shares}
                date={new Date(String(post.createdAt))}
                onLikeClick={() => likePost(post.id)}
                onShareClick={() => sharePost(post.id)}
                by
                reverse={reverse}
                uid={String(post.author.id)}
                user={getUserData(String(post.author.id))}
              />
            </span>
            <div>
              {typeof post.commentCount !== undefined && (
                <span
                  aria-label="View post comments"
                  className={`italic font-bold text-xs leading-3 px-0 bg-transparent tracking-tighter pt-2`}
                >
                  {post.commentCount! > 0
                    ? `${post.commentCount} comment${
                        post.commentCount! > 1 ? "s" : ""
                      }`
                    : "No comments"}
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <></>
      )}
    </article>
  );
}
