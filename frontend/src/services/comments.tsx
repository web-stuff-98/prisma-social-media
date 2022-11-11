import { makeRequest } from "./makeRequest";

const createComment = ({
  postId,
  message,
  parentId,
}: {
  postId: string;
  message: string;
  parentId?: string;
}) =>
  makeRequest(`/api/posts/${postId}/comments`, {
    method: "POST",
    data: { message, parentId },
    withCredentials: true,
  });

const updateComment = ({
  postId,
  message,
  id,
}: {
  postId: string;
  message: string;
  id: string;
}) =>
  makeRequest(`/api/posts/${postId}/comments/${id}`, {
    method: "PUT",
    data: { message },
    withCredentials: true,
  });

const deleteComment = ({ postId, id }: { postId: string; id: string }) =>
  makeRequest(`/api/posts/${postId}/comments/${id}`, {
    method: "DELETE",
    withCredentials: true,
  });

const toggleCommentLike = ({ id, postId }: { id: string; postId: string }) =>
  makeRequest(`/api/posts/${postId}/comments/${id}/toggleLike`, {
    method: "POST",
    withCredentials: true,
  });

export { createComment, updateComment, deleteComment, toggleCommentLike };
