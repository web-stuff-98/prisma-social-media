import { makeRequest } from "./makeRequest";

const getPosts = () => makeRequest("/api/posts");
const getPost = (slug:string) => makeRequest(`/api/posts/${slug}`);

export { getPost, getPosts };
