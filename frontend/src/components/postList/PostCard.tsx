import { useNavigate } from "react-router-dom";
import { useFilter } from "../../context/FilterContext";
import { IPost, usePosts } from "../../context/PostsContext";
import useUsers from "../../context/UsersContext";
import User from "../User";
import { RiEditBoxFill, RiDeleteBin4Fill } from "react-icons/ri";
import { IconBtn } from "../IconBtn";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useModal } from "../../context/ModalContext";
import { deletePost } from "../../services/posts";

export default function PostCard({
  post,
  reverse = false,
}: {
  post: IPost;
  reverse: boolean;
}) {
  const navigate = useNavigate();
  const { getUserData } = useUsers();
  const { likePost, sharePost } = usePosts();
  const { openModal } = useModal();
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
    observer.observe(containerRef.current!);
    return () => {
      observer.disconnect();
    };
  }, [containerRef.current]);

  return (
    <article
      ref={containerRef}
      className={`p-2 md:pl-2 bg-foreground dark:bg-darkmodeForeground shadow-lg rounded border dark:border-stone-800 text-center sm:h-28 md:h-postHeight gap-1 sm:flex-col md:flex ${
        reverse ? "md:flex-row-reverse" : "md:flex-row"
      } h-full w-full justify-evenly`}
    >
      <div
        style={{
          backgroundImage: `url(${post.blur})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="relative border border-zinc-700 shadow-md sm:w-full sm:h-28 md:w-64 md:min-w-postWidth md:max-w-postWidth md:h-postImageHeight bg-gray-200 shadow rounded overflow-hidden shadow"
      >
        {visible && (
          <img
            style={{
              background: "transparent",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
            src={`https://d2gt89ey9qb5n6.cloudfront.net/thumb.${post.imageKey}`}
          />
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
          reverse ? "end" : "start"
        } mx-auto grow p-1`}
      >
        <h3
          style={{ lineHeight: "0.875" }}
          className={`font-Archivo tracking-tight sm:text-sm md:text-lg sm:mx-auto md:mx-0 sm:py-0 pt-0 sm:text-center ${
            reverse ? "md:text-right" : "md:text-left"
          } font-black`}
        >
          {post.title}
        </h3>
        <p
          style={{ lineHeight: "0.95" }}
          className={`sm:text-center px-0 sm:text-xs py-0.5 sm:mx-auto md:mx-0 text-sm ${
            reverse ? "md:text-right" : "md:text-left"
          }`}
        >
          {post.description}
        </p>
        <div
          aria-label="Tags"
          style={{ filter: "drop-shadow(0px 1.5px 1px rgba(0,0,0,0.5))" }}
          className={`flex py-0.5 flex-wrap sm:justify-center ${
            reverse ? "md:justify-end" : "md:justify-start"
          } items-start w-full gap-0.5`}
        >
          {post.tags.map((tag) => (
            <span
              onClick={() => autoAddRemoveSearchTag(tag.trim())}
              key={tag}
              style={
                searchTags.includes(tag)
                  ? {
                      filter: "opacity(0.5) saturate(0)",
                    }
                  : {}
              }
              className="text-xs rounded cursor-pointer bg-gray-900 hover:bg-gray-800 text-white leading-4 hover:bg-gray-600 py-0.5 px-1 sm:py-0 dark:bg-amber-700 dark:hover:bg-amber-600 dark:border-zinc-200 dark:border border border-zinc-300"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="sm:mx-auto mt-1.5 md:mx-0">
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
        <span
          onClick={() => navigate(`/posts/${post.slug}`)}
          className="italic text-xs leading-3 font-bold cursor-pointer pt-2"
        >
          Read more...
        </span>
      </div>
    </article>
  );
}
