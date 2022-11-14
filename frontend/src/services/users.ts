import { IUser } from "../context/AuthContext";
import { makeRequest } from "./makeRequest";

const getUser = (uid: string) => makeRequest(`/api/users/${uid}`);
const updateUser = (data: Partial<IUser>) =>
  makeRequest(`/api/users`, {
    withCredentials: true,
    method: "POST",
    data
  });

export { getUser, updateUser };
