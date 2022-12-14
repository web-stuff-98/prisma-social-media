import { IconBtn } from "./IconBtn";
import { RiEditBoxFill, RiDeleteBin4Fill } from "react-icons/ri";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { IUser, useAuth } from "../context/AuthContext";
import { BsShare, BsShareFill } from "react-icons/bs";

import { useRef, useLayoutEffect } from "react";
import useUsers from "../context/UsersContext";
import { useInterface } from "../context/InterfaceContext";
import { useUserdropdown } from "../context/UserdropdownContext";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
  timeStyle: "short",
});

/**
 * date = Not required, renders a date under the username
 *
 * editDeleteIcons = if true, show edit/delete icons between pfp and text
 * you will need to assign the other variables for that too
 */

export default function User({
  date,
  user,
  by,
  uid,
  editDeleteIcons,
  likeShareIcons,
  onEditClick,
  onDeleteClick,
  onLikeClick,
  onShareClick,
  liked,
  likes = 0,
  shared,
  shares = 0,
  isEditing,
  isDeleting,
  reverse,
  overridePfpOnClick,
  overridePfpBase64 = "",
  pfpCursor,
  isServer,
  chatroomId,
  micro,
  style = {},
  fixDarkBackgroundContrast,
}: {
  date?: Date;
  user?: IUser;
  uid?: string; //there has to be a UID for every real user, but the server has no uid
  by?: boolean;
  editDeleteIcons?: boolean;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  likeShareIcons?: boolean;
  onLikeClick?: () => void;
  onShareClick?: () => void;
  liked?: boolean;
  likes?: number;
  shared?: boolean;
  shares?: number;
  isEditing?: boolean;
  isDeleting?: boolean;
  reverse?: boolean;
  overridePfpOnClick?: Function;
  overridePfpBase64?: string;
  pfpCursor?: boolean;
  isServer?: boolean;
  chatroomId?: string;
  micro?: boolean;
  style?: object;
  fixDarkBackgroundContrast?: boolean;
}) {
  const { openUserdropdown } = useUserdropdown();
  const { user: currentUser } = useAuth();
  const { cacheUserData } = useUsers();
  const { state: iState } = useInterface();
  const { userEnteredView, userLeftView } = useUsers();

  const containerRef = useRef(null);

  const observer = new IntersectionObserver(([entry]) => {
    if (!uid || uid === "undefined") return;
    if (entry.isIntersecting) {
      userEnteredView(uid);
      cacheUserData(uid);
    } else {
      userLeftView(uid);
    }
  });
  useLayoutEffect(() => {
    observer.observe(containerRef.current!);
    return () => {
      if (uid) userLeftView(uid);
      observer.disconnect();
    };
    //putting the ref in the dependency array was the only way to get this working properly for some reason
  }, [containerRef.current]);

  const getDateString = (date: Date) => dateFormatter.format(date);
  const renderDateTime = (dateString: string) => {
    return (
      <div
        style={{ lineHeight: "0.866" }}
        className={`flex tracking-tight mb-1 flex-col text-xs ${
          reverse ? "items-end" : "items-start"
        }`}
      >
        <span>{dateString.split(", ")[0]}</span>
        <span>{dateString.split(", ")[1]}</span>
      </div>
    );
  };

  return (
    <div
      style={style}
      ref={containerRef}
      className={`${reverse ? "text-right" : "text-left"} flex ${
        reverse ? "flex-row-reverse" : ""
      } items-center justify-center`}
    >
      {likeShareIcons && (
        <div
          className={`h-full drop-shadow ${
            reverse ? "pr-0.5 pl-1" : "pr-1 pl-0.5"
          } flex flex-col gap-1`}
        >
          <IconBtn
            redirectToLogin
            onClick={onLikeClick}
            Icon={liked ? AiFillLike : AiOutlineLike}
            aria-label={liked ? "Unlike" : "Like"}
            color={
              fixDarkBackgroundContrast
                ? liked
                  ? "text-stone-200 dark:text-stone-200"
                  : "text-stone-400 dark:text-stone-400"
                : liked
                ? "text-stone-500 dark:text-stone-400"
                : "text-stone-400 dark:text-stone-400"
            }
          >
            {likes > 0 && (
              <div
                style={{
                  zIndex: "96",
                  top: "-25%",
                  left: reverse ? "27.5%" : "-27.5%",
                }}
                className={`absolute text-md ${
                  fixDarkBackgroundContrast
                    ? "text-green-400"
                    : "text-stone-900 dark:text-green-500"
                } font-extrabold drop-shadow leading-3 tracking-tighter`}
              >
                {likes}
              </div>
            )}
          </IconBtn>
          <IconBtn
            redirectToLogin
            onClick={onShareClick}
            Icon={shared ? BsShareFill : BsShare}
            aria-label={shared ? "Unshare" : "Share"}
            color={
              fixDarkBackgroundContrast
                ? shared
                  ? "text-stone-200 dark:text-stone-200"
                  : "text-stone-400 dark:text-stone-400"
                : shared
                ? "text-stone-500 dark:text-stone-400"
                : "text-stone-400 dark:text-stone-400"
            }
          >
            {shares > 0 && (
              <div
                style={{
                  zIndex: "96",
                  top: "-25%",
                  left: reverse ? "27.5%" : "-27.5%",
                }}
                className={`absolute text-md ${
                  fixDarkBackgroundContrast
                    ? "text-green-400"
                    : "text-stone-900 dark:text-green-500"
                } font-extrabold drop-shadow leading-3 tracking-tighter`}
              >
                {shares}
              </div>
            )}
          </IconBtn>
        </div>
      )}
      <div
        style={{
          ...(overridePfpBase64
            ? {
                backgroundImage: `url(${overridePfpBase64})`,
              }
            : {
                backgroundImage: `url(${
                  isServer
                    ? iState.darkMode
                      ? "/pfp_server_dark.png"
                      : "/pfp_server.png"
                    : user?.pfp ||
                      (iState.darkMode ? "/pfp_dark.png" : "/pfp.png")
                })`,
              }),
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
        onClick={() => {
          if (overridePfpOnClick) {
            return overridePfpOnClick();
          }
          if (currentUser && uid)
            if (user?.id !== currentUser?.id) openUserdropdown(uid, chatroomId);
        }}
        className={`${
          micro ? "w-5 h-5" : date && !isServer ? "w-9 h-9" : "w-8 h-8"
        } border ${
          fixDarkBackgroundContrast ? "border-white" : "border-black"
        } dark:border-white relative ${
          ((currentUser && user?.id !== currentUser?.id && uid) || pfpCursor) &&
          "cursor-pointer"
        } ${micro ? "rounded" : "rounded-full"} ${!isServer && "shadow-md"}`}
      >
        {user?.online && (
          <span
            style={{
              width: "0.5rem",
              height: "0.5rem",
              bottom: micro ? "-6px" : 0,
              right: micro ? "-6px" : 0,
            }}
            className="absolute z-30 rounded-full shadow border border-black bg-green-500"
          />
        )}
      </div>
      {editDeleteIcons && (
        <div
          className={`h-full drop-shadow ${
            reverse ? "pl-0.5 pr-1" : "pl-1 pr-0.5"
          } flex flex-col gap-1`}
        >
          <IconBtn
            onClick={() => {
              if (onEditClick) onEditClick();
            }}
            isActive={isEditing}
            Icon={RiEditBoxFill}
            aria-label={isEditing ? "Cancel Edit" : "Edit"}
          />
          <IconBtn
            disabled={isDeleting}
            onClick={onDeleteClick}
            Icon={RiDeleteBin4Fill}
            aria-label="Delete"
            color="text-rose-600"
          />
        </div>
      )}
      {!micro && (
        <div className="leading-3 mt-0.5 px-1">
          {user && (
            <h1
              className={`font-bold ${
                date ? "text-sm" : "text-xs"
              } leading-4 tracking-tight whitespace-nowrap`}
            >
              {by && "By "}
              {user?.name}
            </h1>
          )}
          {date && renderDateTime(getDateString(date))}
        </div>
      )}
    </div>
  );
}
