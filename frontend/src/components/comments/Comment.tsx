import { IconBtn } from "../IconBtn";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { FaReply } from "react-icons/fa";
import { IPostComment, usePost } from "../../context/PostContext";
import { useState, useCallback } from "react";
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

export function Comment({
  id,
  message,
  user,
  createdAt,
  likeCount,
  likedByMe,
}: IPostComment) {
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

  const [areChildrenHidden, setAreChildrenHidden] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const {
    post,
    getReplies,
    createLocalComment,
    updateLocalComment,
    deleteLocalComment,
    toggleLocalCommentLike,
  } = usePost();
  const createCommentFn = useAsyncFn(createComment);
  const updateCommentFn = useAsyncFn(updateComment);
  const deleteCommentFn = useAsyncFn(deleteComment);
  const toggleCommentLikeFn = useAsyncFn(toggleCommentLike);
  const childComments = getReplies(id);

  const { user: currentUser } = useAuth();
  const { setReplyingTo, replyingTo } = usePost();
  const { getUserData } =useUsers()

  const onCommentReply = (message: string) =>
    createCommentFn
      .execute({ postId: post?.id, message, parentId: id })
      .then((comment: IPostComment) => {
        if (replyingTo === id) setReplyingTo("");
        createLocalComment(comment);
      });

  const onCommentUpdate = (message: string) =>
    updateCommentFn
      .execute({ postId: post?.id, message, id })
      .then((comment: IPostComment) => {
        setIsEditing(false);
        updateLocalComment(id, comment.message);
      });

  const onCommentDelete = () =>
    deleteCommentFn
      .execute({ postId: post?.id, id })
      .then((comment: IPostComment) => deleteLocalComment(comment.id));

  const onToggleCommentLike = () =>
    toggleCommentLikeFn
      .execute({ id, postId: post?.id })
      .then(({ addLike }: { addLike: boolean }) =>
        toggleLocalCommentLike(id, addLike)
      );

  const [hideRepliesBarHover, setHideRepliesBarHover] = useState(false);
  const handleHideRepliesBarEnter = () => setHideRepliesBarHover(true);
  const handleHideRepliesBarLeave = () => setHideRepliesBarHover(false);

  return (
    <>
      <div className="w-full mb-2 flex">
        <div className="mr-4 my-auto">
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
        </div>
        <div className="w-full flex items-center">
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
            </p>
          )}
          {currentUser && (
            <div className="flex flex-col">
              <IconBtn
                onClick={onToggleCommentLike}
                disabled={toggleCommentLikeFn.loading}
                Icon={likedByMe ? AiFillLike : AiOutlineLike}
                aria-label={likedByMe ? "Unlike" : "Like"}
              >
                {likeCount}
              </IconBtn>
              <IconBtn
                onClick={() => {
                  if (replyingTo !== id) setReplyingTo(id);
                  else setReplyingTo("");
                }}
                isActive={replyingTo === id}
                Icon={FaReply}
                aria-label={replyingTo === id ? "Cancel Reply" : "Reply"}
              />
            </div>
          )}
          {deleteCommentFn.error && (
            <div className="error-msg mt-1">{deleteCommentFn.error}</div>
          )}
        </div>
      </div>
      {replyingTo === id && currentUser && (
        <div>
          <CommentForm
            autoFocus
            onSubmit={onCommentReply}
            loading={createCommentFn.loading}
            error={createCommentFn.error}
            placeholder="Reply to comment..."
            onClickOutside={() => setReplyingTo("")}
          />
        </div>
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
                left: "calc(1rem - 1px)",
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
                style={{ width: "2px", borderRadius: "2px" }}
                className={`${
                  hideRepliesBarHover ? "bg-amber-600" : "bg-stone-200"
                } h-full`}
              />
            </button>
            <div className="nested-comments">
              {childComments.map((comment) => (
                <div key={comment.id} className="w-full h-full">
                  <Comment {...comment} />
                </div>
              ))}
            </div>
          </div>
          <button
            className={`btn bg-transparent italic text-black px-0 mb-2 text-xs ${
              !areChildrenHidden ? "hidden" : ""
            }`}
            onClick={() => setAreChildrenHidden(false)}
          >
            Show Replies
          </button>
        </>
      )}
    </>
  );
}
