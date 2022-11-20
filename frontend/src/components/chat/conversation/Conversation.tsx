import MessageForm from "../messages/MessageForm";

import useCustomArrayAsync from "../../../hooks/useCustomArrayAsync";

import { useCallback, useEffect, useState, useRef } from "react";
import type { FormEvent, ChangeEvent } from "react";

import {
  getConversation,
  sendPrivateMessage,
  uploadPrivateMessageAttachment,
} from "../../../services/chat";

import { useSocket } from "../../../context/SocketContext";
import { IMessage, useChat } from "../../../context/ChatContext";

import MessageList from "../messages/MessageList";
import MessengerError from "../MessengerError";

export default function ConversationSection({
  conversationWith = "",
}: {
  conversationWith: string;
}) {
  const {
    status,
    error,
    value: messages,
    setValueState: setMessages,
  } = useCustomArrayAsync(
    getConversation,
    [conversationWith],
    "private_message_update",
    "private_message_delete",
    "private_message",
    (a: IMessage, b: IMessage) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const { socket } = useSocket();
  const { setChatSection } = useChat();

  const [err, setErr] = useState("");

  const messagesBottomRef = useRef<HTMLSpanElement>(null);
  const [messageInput, setMessageInput] = useState("");
  const handleMessageInput = (e: ChangeEvent<HTMLInputElement>) =>
    setMessageInput(e.target.value);
  const handleMessageSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await sendPrivateMessage(
        messageInput,
        conversationWith,
        file ? true : false
      );
    } catch (e) {
      setErr(`${e}`);
    }
  };
  const [file, setFile] = useState<File>();
  const fileRef = useRef<File>();
  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length === 0) return;
    const f = e.target?.files![0];
    if (!f) return;
    setFile(f);
    fileRef.current = f;
  };

  useEffect(() => {
    if (!messages) return;
    messagesBottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    socket.on(
      "private_message_request_attachment_upload",
      handleUploadAttachment
    );
    socket.on("private_conversation_deleted", handleConversationDeleted);
    socket.on("private_message_attachment_complete", handleAttachmentComplete);
    socket.on("private_message_attachment_failed", handleAttachmentFailed);
    socket.on("private_message_attachment_progress", handleAttachmentProgress);
    return () => {
      socket.off(
        "private_message_attachment_complete",
        handleAttachmentComplete
      );
      socket.off("private_message_attachment_failed", handleAttachmentFailed);
      socket.off(
        "private_message_attachment_progress",
        handleAttachmentProgress
      );
      socket.off(
        "private_message_request_attachment_upload",
        handleUploadAttachment
      );
      socket.off("private_conversation_deleted", handleConversationDeleted);
    };
  }, [socket]);

  const handleUploadAttachment = useCallback(
    async (id: string) => {
      try {
        if (!fileRef.current) throw new Error("No file selected");
        await uploadPrivateMessageAttachment(
          id,
          fileRef.current.size,
          fileRef.current
        ).then(() => setFile(undefined));
      } catch (e) {}
    },
    [file]
  );
  const handleConversationDeleted = useCallback((sender: string) => {
    if (conversationWith === sender) {
      setChatSection("Conversations");
    }
    setMessages((p) => [...p.filter((msg) => msg.senderId !== sender)]);
  }, []);
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
    <div className="w-full h-full flex flex-col items-between justify-between">
      <MessageList messages={messages} status={status} error={error} />
      {err && <MessengerError err={err} closeError={() => setErr("")} />}
      <MessageForm
        file={file}
        handleFileInput={handleFileInput}
        handleMessageInput={handleMessageInput}
        handleMessageSubmit={handleMessageSubmit}
        messageInput={messageInput}
      />
    </div>
  );
}
