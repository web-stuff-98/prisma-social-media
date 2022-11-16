import { makeRequest } from "./makeRequest";

const getConversations = () =>
  makeRequest("/api/messenger/conversations", { withCredentials: true });
const getConversation = (uid: string) =>
  makeRequest(`/api/messenger/conversation/${uid}`, { withCredentials: true });
const deleteConversation = (uid: string) =>
  makeRequest(`/api/messenger/conversation/${uid}`, {
    withCredentials: true,
    method: "DELETE",
  });
const uploadAttachment = (msgId: string, bytes: number, file: File) => {
  var data = new FormData()
  if(!file) throw new Error("No file!")
  data.append("file", file)
  data.append("twat", "fuck")
  console.log(data)
  makeRequest(`/api/messenger/attachment/${msgId}/${bytes}`, {
    withCredentials: true,
    method:"POST",
    data,
    headers: {
      "Content-Type":"multipart/form-data"
    }
  });
}

export {
  getConversations,
  getConversation,
  deleteConversation,
  uploadAttachment,
};
