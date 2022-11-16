import { IPost } from "../context/PostContext";
import { makeRequest } from "./makeRequest";

const getPosts = () => makeRequest("/api/posts", { withCredentials: true });
const getPost = (slug: string) =>
  makeRequest(`/api/posts/${slug}`, { withCredentials: true });
const createPost = (data: IPost) =>
  makeRequest(`/api/posts`, { withCredentials: true, method: "POST", data });
const updatePost = (data: IPost, slug:string) =>
  makeRequest(`/api/posts/${slug}`, {
    withCredentials: true,
    method: "PUT",
    data,
  });
const toggleLike = (id: string) =>
  makeRequest(`/api/posts/${id}/toggleLike`, {
    method: "POST",
    withCredentials: true,
  });
const toggleShare = (id: string) =>
  makeRequest(`/api/posts/${id}/toggleShare`, {
    method: "POST",
    withCredentials: true,
  });

export { getPost, getPosts, toggleLike, toggleShare, createPost, updatePost };