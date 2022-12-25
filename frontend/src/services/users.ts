import { makeRequest } from "./makeRequest";

const getUser = (uid: string) => makeRequest(`/api/users/${uid}`);
const updatePfp = (file: File) => {
  const data = new FormData();
  data.append("file", file);
  return makeRequest(`/api/users/pfp`, {
    withCredentials: true,
    method: "POST",
    data,
  });
};
const getProfile = (uid: string) =>
  makeRequest(`/api/users/profile/${uid}`, { withCredentials: true });
const updateProfile = (bio?: string) =>
  makeRequest(`/api/users/profile`, {
    method: "PUT",
    withCredentials: true,
    data: { bio },
  });
const updateProfileImage = (file: File) => {
  const data = new FormData();
  data.append("file", file);
  return makeRequest(`/api/users/profile/image`, {
    withCredentials: true,
    method: "POST",
    data,
  });
};

export { getUser, updatePfp, getProfile, updateProfile, updateProfileImage };