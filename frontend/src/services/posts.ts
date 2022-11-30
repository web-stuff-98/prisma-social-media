import { IPost } from "../context/PostsContext";
import { makeRequest } from "./makeRequest";

const getPosts = () => makeRequest("/api/posts", { withCredentials: true });
const getPage = async (page: number, tags?: string, term?: string) => {
  if (tags && term)
    throw new Error(
      "You cannot provide both a search term and tags. Provide one or the other."
    );
  return await makeRequest(
    `/api/posts/page/${page}${tags ? `?tags=${tags}` : ""}${
      term ? `?term=${term}` : ""
    }`,
    { withCredentials: true }
  );
};
const getPopularPosts = () =>
  makeRequest("/api/posts/popular", { withCredentials: true });
const getPost = (slug: string) =>
  makeRequest(`/api/posts/${slug}`, { withCredentials: true });
const createPost = (data: IPost) =>
  makeRequest(`/api/posts`, { withCredentials: true, method: "POST", data });
const updatePost = (data: IPost, slug: string) =>
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

export {
  getPage,
  getPost,
  getPosts,
  getPopularPosts,
  toggleLike,
  toggleShare,
  createPost,
  updatePost,
};
