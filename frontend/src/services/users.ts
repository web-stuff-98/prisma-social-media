import { IUser } from "../context/AuthContext";
import { makeRequest } from "./makeRequest";

const getUser = (uid: string) => makeRequest(`/api/users/${uid}`);
const updateUser = (data: Partial<IUser>) =>
  makeRequest(`/api/users`, {
    withCredentials: true,
    method: "POST",
    data,
  });
const getProfile = (uid: string) =>
  makeRequest(`/api/users/profile/${uid}`, { withCredentials: true });
const updateProfile = (data: { bio?: string; backgroundBase64: string }) =>
  makeRequest(`/api/users/profile`, {
    method: "PUT",
    withCredentials: true,
    data,
  });

export { getUser, updateUser, getProfile, updateProfile };
