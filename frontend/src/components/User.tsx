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
  by = undefined,
  uid,
  editDeleteIcons = false,
  likeShareIcons = false,
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
  reverse = false,
  overridePfpOnClick = undefined,
  overridePfpBase64 = "",
  pfpCursor,
}: {
  date?: Date;
  user?: IUser;
  uid: string;
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
}) {
  const { openUserdropdown } = useUserdropdown();
  const { user: currentUser } = useAuth();
  const { cacheUserData } = useUsers();
  const { state: iState } = useInterface();

  const { userEnteredView, userLeftView } = useUsers();

  const containerRef = useRef(null);

  const observer = new IntersectionObserver(([entry]) => {
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
      userLeftView(uid);
      observer.disconnect();
    };
    //putting the ref in the dependency array was the only way to get this working properly for some reason
  }, [containerRef.current]);

  const getDateString = (date: Date) => dateFormatter.format(date);
  const renderDateTime = (dateString: string) => {
    return (
      <div
        className={`flex tracking-tighter flex-col text-xs leading-3 ${
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
            onClick={onLikeClick}
            Icon={liked ? AiFillLike : AiOutlineLike}
            aria-label={liked ? "Unlike" : "Like"}
          >
            {likes > 0 && <div
              style={{ zIndex: "96", top: "-25%", left: "-33.33%" }}
              className="absolute text-sm drop-shadow-md leading-3 tracking-tighter"
            >
              {likes}
            </div>}
          </IconBtn>
          <IconBtn
            onClick={onShareClick}
            Icon={shared ? BsShareFill : BsShare}
            aria-label="Share"
          >
            {shares > 0 && <div
              style={{ zIndex: "96", top: "-25%", left: "-33.33%" }}
              className="absolute text-sm drop-shadow-md leading-3 tracking-tighter"
            >
              {shares}
            </div>}
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
                  user?.pfp ||
                  (iState.darkMode ? "./pfp_dark.png" : "./pfp.png")
                })`,
              }),
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
        onClick={() => {
          if (overridePfpOnClick) {
            return overridePfpOnClick();
          }
          if (currentUser)
            if (user?.id !== currentUser?.id) openUserdropdown(uid);
        }}
        className={`${date ? "w-10 h-10" : "w-8 h-8"} relative ${
          ((currentUser && user?.id !== currentUser?.id) || pfpCursor) &&
          "cursor-pointer"
        } rounded-full border border-black dark:border-zinc-600 shadow-md`}
      >
        {user?.online && (
          <span
            style={{
              width: "0.5rem",
              height: "0.5rem",
              bottom: 0,
              right: 0,
            }}
            className="absolute rounded-full shadow bg-green-500"
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
      <div className="leading-3 mt-0.5 px-1">
        {user && (
          <h1
            className={`font-bold ${
              date ? "text-sm" : "text-xs"
            } leading-3 tracking-tight whitespace-nowrap`}
          >
            {by && "By "}
            {user?.name}
          </h1>
        )}
        {date && renderDateTime(getDateString(date))}
      </div>
    </div>
  );
}
