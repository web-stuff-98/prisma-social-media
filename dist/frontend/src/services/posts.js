"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCoverImage = exports.deletePost = exports.uploadCoverImage = exports.updatePostData = exports.uploadPostData = exports.toggleShare = exports.toggleLike = exports.getPopularPosts = exports.getPosts = exports.getPost = exports.getPage = void 0;
const makeRequest_1 = require("./makeRequest");
const getPosts = () => (0, makeRequest_1.makeRequest)("/api/posts", { withCredentials: true });
exports.getPosts = getPosts;
const getPage = (queryAndPagePortion) => __awaiter(void 0, void 0, void 0, function* () {
    return yield (0, makeRequest_1.makeRequest)(`/api/posts/page/${queryAndPagePortion}`, { withCredentials: true });
});
exports.getPage = getPage;
const getPopularPosts = () => (0, makeRequest_1.makeRequest)("/api/posts/popular", { withCredentials: true });
exports.getPopularPosts = getPopularPosts;
const getPost = (slug) => (0, makeRequest_1.makeRequest)(`/api/posts/${slug}`, { withCredentials: true });
exports.getPost = getPost;
const deletePost = (slug) => (0, makeRequest_1.makeRequest)(`/api/posts/${slug}`, {
    method: "DELETE",
    withCredentials: true,
});
exports.deletePost = deletePost;
const uploadPostData = (data) => (0, makeRequest_1.makeRequest)(`/api/posts`, { withCredentials: true, method: "POST", data });
exports.uploadPostData = uploadPostData;
const uploadCoverImage = (slug, file, bytes) => __awaiter(void 0, void 0, void 0, function* () {
    var formData = new FormData();
    formData.append("file", file);
    yield (0, makeRequest_1.makeRequest)(`/api/posts/${slug}/image/${bytes}`, {
        withCredentials: true,
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        data: formData,
    });
});
exports.uploadCoverImage = uploadCoverImage;
const updateCoverImage = (slug, file, bytes) => __awaiter(void 0, void 0, void 0, function* () {
    var formData = new FormData();
    formData.append("file", file);
    yield (0, makeRequest_1.makeRequest)(`/api/posts/${slug}/image/${bytes}`, {
        withCredentials: true,
        method: "PUT",
        headers: { "Content-Type": "multipart/form-data" },
        data: formData,
    });
});
exports.updateCoverImage = updateCoverImage;
const updatePostData = (data, slug) => (0, makeRequest_1.makeRequest)(`/api/posts/${slug}`, {
    withCredentials: true,
    method: "PUT",
    data,
});
exports.updatePostData = updatePostData;
const toggleLike = (id) => (0, makeRequest_1.makeRequest)(`/api/posts/${id}/toggleLike`, {
    method: "POST",
    withCredentials: true,
});
exports.toggleLike = toggleLike;
const toggleShare = (id) => (0, makeRequest_1.makeRequest)(`/api/posts/${id}/toggleShare`, {
    method: "POST",
    withCredentials: true,
});
exports.toggleShare = toggleShare;
