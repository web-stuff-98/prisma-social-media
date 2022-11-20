import MessageForm from "../messages/MessageForm";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChangeEvent, FormEvent } from "react";
import {
  getRoomMessages,
  sendRoomMessage,
  uploadRoomMessageAttachment,
} from "../../../services/chat";
import MessageList from "../messages/MessageList";
import useCustomArrayAsync from "../../../hooks/useCustomArrayAsync";
import { IMessage, useChat } from "../../../context/ChatContext";
import { useSocket } from "../../../context/SocketContext";
import MessengerError from "../MessengerError";
import useUsers from "../../../context/UsersContext";

export default function Room({ roomId }: { roomId: string }) {
  const { socket } = useSocket();
  const { getUserData } = useUsers();
  const { rooms, setTopText } = useChat();

  const getAuthorName = useCallback(
    (uid: string) => {
      const u = getUserData(uid);
      return u ? u.name : "";
    },
    [rooms]
  );

  const [err, setErr] = useState("");

  useEffect(() => {
    const found = rooms.find((r) => r.id === roomId);
    if (found)
      setTopText(`${found?.name} - by ${getAuthorName(found.authorId)}`);
  }, [rooms]);

  const [messageInput, setMessageInput] = useState("");
  const handleMessageInput = (e: ChangeEvent<HTMLInputElement>) =>
    setMessageInput(e.target.value);
  const [file, setFile] = useState<File>();
  const fileRef = useRef<File>();
  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length === 0) return;
    const f = e.target?.files![0];
    if (!f) return;
    setFile(f);
    fileRef.current = f;
  };

  const handleMessageSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await sendRoomMessage(messageInput, roomId, file ? true : false);
    } catch (e) {
      setErr(`${e}`);
    }
  };

  const {
    status,
    error,
    value: messages,
    setValueState: setMessages,
  } = useCustomArrayAsync(
    getRoomMessages,
    [roomId],
    "room_message_update",
    "room_message_delete",
    "room_message",
    (a: IMessage, b: IMessage) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  useEffect(() => {
    if (!socket) return;
    socket.on("room_message_request_attachment_upload", handleUploadAttachment);
    socket.on("room_message_attachment_complete", handleAttachmentComplete);
    socket.on("room_message_attachment_failed", handleAttachmentFailed);
    socket.on("room_message_attachment_progress", handleAttachmentProgress);
    return () => {
      socket.off("room_message_attachment_complete", handleAttachmentComplete);
      socket.off("room_message_attachment_failed", handleAttachmentFailed);
      socket.off("room_message_attachment_progress", handleAttachmentProgress);
      socket.off(
        "room_message_request_attachment_upload",
        handleUploadAttachment
      );
    };
  }, [socket]);

  const handleUploadAttachment = useCallback(
    async (id: string) => {
      try {
        console.log("UPLOAD");
        if (!fileRef.current) throw new Error("No file selected");
        await uploadRoomMessageAttachment(
          id,
          fileRef.current.size,
          fileRef.current
        ).then(() => setFile(undefined));
      } catch (e) {}
    },
    [file]
  );
  const handleAttachmentComplete = useCallback(
    (messageId: string, type: string, key: string) => {
      setMessages((p) => {
        let newMsgs = p;
        const i = newMsgs.findIndex((msg) => msg.id === messageId);
        if (!newMsgs[i] || !newMsgs[i].attachmentPending) return p;
        newMsgs[i] = {
          ...newMsgs[i],
          hasAttachment: true,
          attachmentPending: false,
          attachmentType: type,
          attachmentKey: key,
          attachmentError: false,
        };
        return [...newMsgs];
      });
    },
    []
  );
  const handleAttachmentFailed = useCallback((messageId: string) => {
    setMessages((p) => {
      let newMsgs = p;
      const i = newMsgs.findIndex((msg) => msg.id === messageId);
      newMsgs[i] = {
        ...newMsgs[i],
        attachmentPending: false,
        attachmentError: true,
      };
      return [...newMsgs];
    });
  }, []);
  const handleAttachmentProgress = useCallback(
    (progress: number, messageId: string) => {
      setMessages((p) => {
        let newMsgs = p;
        const i = newMsgs.findIndex((msg) => msg.id === messageId);
        newMsgs[i] = {
          ...newMsgs[i],
          attachmentProgress: Math.max(0.05, progress),
        };
        return [...newMsgs];
      });
    },
    [messages]
  );

  return (
    <div>
      <MessageList roomId={roomId} messages={messages} error={error} status={status} />
      {err && <MessengerError closeError={() => setErr("")} err={err} />}
      <MessageForm
        handleMessageSubmit={handleMessageSubmit}
        messageInput={messageInput}
        handleFileInput={handleFileInput}
        handleMessageInput={handleMessageInput}
        file={file}
      />
    </div>
  );
}
