import { IconBtn } from "../IconBtn";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { FaReply } from "react-icons/fa";
import { IPostComment, usePost } from "../../context/PostContext";
import { useState, useCallback, useEffect, useMemo } from "react";
import {
  createComment,
  deleteComment,
  toggleCommentLike,
  updateComment,
} from "../../services/comments";
import { CommentForm } from "./CommentForm";
import { useAuth } from "../../context/AuthContext";
import User from "../User";
import useUsers from "../../context/UsersContext";
import { usePosts } from "../../context/PostsContext";
import { useNavigate, useParams } from "react-router-dom";
import { useModal } from "../../context/ModalContext";
import { useInterface } from "../../context/InterfaceContext";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
  timeStyle: "short",
});

export function Comment({
  id,
  message,
  user,
  createdAt,
  updatedAt,
  likeCount,
  likedByMe,
  childIndex = 0,
  parentId,
}: IPostComment) {
  const { openModal } = useModal();
  const navigate = useNavigate();
  const { slug } = useParams();
  const {
    state: { maxOpenCommentsInThread },
  } = useInterface();
  const { getPostData } = usePosts();
  const { user: currentUser } = useAuth();
  const { getUserData } = useUsers();
  const { setParentComment, openComments, setCommentOpen,setReplyingTo, replyingTo, parentComment  } = usePost();

  /*
This function is from the web dev simplified video. It is supposed to be in the useAsync hook but that was causing infinite rerenders in the original PostContext, so I changed it to the useAync hook from usehooks.com and it worked. But I'll keep this function here anyway because it works here and dont need to change anything aside from the name.
*/
  function useAsyncFn(func: Function, dependencies: any[] = []) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>();
    const [value, setValue] = useState<any>();
    const execute = useCallback((...params: any[]) => {
      setLoading(true);
      return func(...params)
        .then((data: any) => {
          setValue(data);
          setError(undefined);
          return data;
        })
        .catch((error: any) => {
          setError(error);
          setValue(undefined);
          return Promise.reject(error);
        })
        .finally(() => {
          setLoading(false);
        });
    }, dependencies);
    return { loading, error, value, execute };
  }

  const areChildrenHidden = useMemo(() => {
    if (childIndex > maxOpenCommentsInThread) return true;
    return !openComments.includes(id);
  }, [openComments, childIndex, maxOpenCommentsInThread]);
  const setAreChildrenHidden = (to: boolean) => setCommentOpen(!to, id);

  const [isEditing, setIsEditing] = useState(false);
  const {
    getReplies,
    createLocalComment,
    updateLocalComment,
    deleteLocalComment,
    toggleLocalCommentLike,
  } = usePost();


  const post = getPostData(String(slug));

  const createCommentFn = useAsyncFn(createComment);
  const updateCommentFn = useAsyncFn(updateComment);
  const deleteCommentFn = useAsyncFn(deleteComment);
  const toggleCommentLikeFn = useAsyncFn(toggleCommentLike);
  const childComments = getReplies(id);

  const onCommentReply = (message: string) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    createCommentFn
      .execute({ postId: post?.id, message, parentId: id })
      .then((comment: IPostComment) => {
        if (replyingTo === id) setReplyingTo("");
        createLocalComment(comment);
      });
  };

  const onCommentUpdate = (message: string) =>
    updateCommentFn
      .execute({ postId: post?.id, message, id })
      .then((comment: IPostComment) => {
        setIsEditing(false);
        updateLocalComment(id, comment.message);
      });

  const onCommentDelete = () => {
    openModal("Confirm", {
      err: false,
      pen: false,
      msg: "Are you sure you want to delete this comment?",
      confirmationCallback: () => {
        deleteCommentFn
          .execute({ postId: post?.id, id })
          .then((comment: IPostComment) => deleteLocalComment(comment.id));
      },
    });
  };

  const onToggleCommentLike = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    toggleCommentLikeFn
      .execute({ id, postId: post?.id })
      .then(({ addLike }: { addLike: boolean }) =>
        toggleLocalCommentLike(id, addLike)
      );
  };

  const [hideRepliesBarHover, setHideRepliesBarHover] = useState(false);
  const handleHideRepliesBarEnter = () => setHideRepliesBarHover(true);
  const handleHideRepliesBarLeave = () => setHideRepliesBarHover(false);

  const getDateString = (date: Date) => dateFormatter.format(date);
  const renderEditedAtTimeString = (dateString: string) => (
    <b style={{ filter: "opacity(0.333)" }} className="pl-2">
      Edited {dateString}
    </b>
  );

  useEffect(() => {
    if (parentComment !== null && childIndex === 0) {
      setAreChildrenHidden(false);
      return;
    }
  }, [parentComment]);

  return (
    <>
      <div className={`w-full ${areChildrenHidden ? "" : "mb-2"} flex`}>
        <div className="flex items-start w-full">
          <div className="my-auto flex justify-between items-center w-full">
            <User
              editDeleteIcons={currentUser && currentUser.id === user.id}
              onDeleteClick={() => onCommentDelete()}
              onEditClick={() => setIsEditing((p) => !p)}
              isEditing={isEditing}
              isDeleting={deleteCommentFn.loading}
              date={new Date(createdAt)}
              user={getUserData(user.id)}
              uid={user.id}
            />
            <div className="w-full flex pl-1 items-center">
              {isEditing ? (
                <CommentForm
                  autoFocus
                  initialValue={message}
                  onSubmit={onCommentUpdate}
                  loading={updateCommentFn.loading}
                  error={updateCommentFn.error}
                  placeholder={"Edit comment..."}
                  onClickOutside={() => setIsEditing(false)}
                />
              ) : (
                <p className="flex my-auto leading-4 tracking-tight text-xs p-0 grow items-center">
                  {message}
                  {updatedAt !== createdAt &&
                    renderEditedAtTimeString(
                      getDateString(new Date(updatedAt))
                    )}
                </p>
              )}
            </div>
            <div className="flex flex-col">
              <IconBtn
                onClick={onToggleCommentLike}
                disabled={toggleCommentLikeFn.loading}
                Icon={likedByMe ? AiFillLike : AiOutlineLike}
                aria-label={likedByMe ? "Unlike" : "Like"}
              >
                <div
                  style={{ left: "50%", top: "-50%" }}
                  className="drop-shadow-md absolute text-green-500"
                >
                  {likeCount}
                </div>
              </IconBtn>
              <IconBtn
                onClick={() => {
                  if (!user) navigate("/login");
                  if (replyingTo !== id) setReplyingTo(id);
                  else setReplyingTo("");
                }}
                isActive={replyingTo === id}
                Icon={FaReply}
                aria-label={replyingTo === id ? "Cancel Reply" : "Reply"}
              />
            </div>
          </div>
          {deleteCommentFn.error && (
            <div className="error-msg mt-1">{deleteCommentFn.error}</div>
          )}
        </div>
      </div>
      {replyingTo === id && currentUser && (
          <CommentForm
            autoFocus
            onSubmit={onCommentReply}
            loading={createCommentFn.loading}
            error={createCommentFn.error}
            placeholder="Reply to comment..."
            onClickOutside={() => {
              if (parentComment !== id) setReplyingTo("");
            }}
          />
      )}
      {childComments?.length > 0 && (
        <>
          <div
            style={{ paddingLeft: "10%" }}
            className={`relative mb-2 ${areChildrenHidden ? "hidden" : ""}`}
          >
            <button
              style={{
                position: "absolute",
                left: "calc(0.866rem - 1px)",
                height: "100%",
                width: "10px",
              }}
              className="flex justify-center px-0 bg-transparent"
              onMouseEnter={handleHideRepliesBarEnter}
              onMouseLeave={handleHideRepliesBarLeave}
              aria-label="Hide Replies"
              onClick={() => setAreChildrenHidden(true)}
            >
              <span
                style={{
                  width: "2px",
                  borderRadius: "2px",
                  transition: "100ms linear background",
                }}
                className={`${
                  hideRepliesBarHover ? "bg-amber-600" : "bg-stone-300"
                } h-full`}
              />
            </button>
            <div>
              {childComments.map((comment) => (
                <div key={comment.id} className="w-full h-full">
                  <Comment {...comment} childIndex={childIndex + 1} />
                </div>
              ))}
            </div>
          </div>
          <button
            className={`btn bg-transparent italic text-black px-0 py-0 mt-0 mb-2 text-xs ${
              areChildrenHidden ? "" : "hidden"
            }`}
            onClick={() => {
              if (childIndex > maxOpenCommentsInThread) {
                setParentComment(id);
              }
              setAreChildrenHidden(false);
            }}
          >
            Show Replies ({childComments.length})
          </button>
        </>
      )}
    </>
  );
}
