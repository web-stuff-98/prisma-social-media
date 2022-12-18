"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleCommentLike = exports.deleteComment = exports.updateComment = exports.createComment = void 0;
const makeRequest_1 = require("./makeRequest");
const createComment = ({ postId, message, parentId, }) => (0, makeRequest_1.makeRequest)(`/api/posts/${postId}/comments`, {
    method: "POST",
    data: { message, parentId },
    withCredentials: true,
});
exports.createComment = createComment;
const updateComment = ({ postId, message, id, }) => (0, makeRequest_1.makeRequest)(`/api/posts/${postId}/comments/${id}`, {
    method: "PUT",
    data: { message },
    withCredentials: true,
});
exports.updateComment = updateComment;
const deleteComment = ({ postId, id }) => (0, makeRequest_1.makeRequest)(`/api/posts/${postId}/comments/${id}`, {
    method: "DELETE",
    withCredentials: true,
});
exports.deleteComment = deleteComment;
const toggleCommentLike = ({ id, postId }) => (0, makeRequest_1.makeRequest)(`/api/posts/${postId}/comments/${id}/toggleLike`, {
    method: "POST",
    withCredentials: true,
});
exports.toggleCommentLike = toggleCommentLike;
