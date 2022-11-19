import Message from "./Message";
import MessageForm from "./MessageForm";

import useCustomArrayAsync from "../../../hooks/useCustomArrayAsync";

import { useCallback, useEffect, useState, useRef } from "react";
import type { FormEvent, ChangeEvent } from "react";
import {
  getConversation,
  sendPrivateMessage,
  uploadPrivateMessageAttachment,
} from "../../../services/chat";
import { useSocket } from "../../../context/SocketContext";
import { useAuth } from "../../../context/AuthContext";
import { MdError } from "react-icons/md";
import { useMessenger } from "../../../context/MessengerContext";
import { ImSpinner8 } from "react-icons/im";

export interface IMessage {
  id: string;
  message: string;
  senderId: string;
  recipientId?: string; //recipientId doesn't actually exist for messages retrieved from getConversations (it might though now I'm not sure)
  hasAttachment: boolean;
  attachmentType?: string;
  attachmentKey?: string;
  attachmentPending?: boolean;
  attachmentError?: boolean;
  attachmentProgress?: number;
  createdAt: Date;
  updatedAt: Date;
}

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
    (a: IMessage, b: IMessage) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
  );

  const { socket } = useSocket();
  const { user } = useAuth();
  const { setMessengerSection } = useMessenger();

  const messagesBottomRef = useRef<HTMLSpanElement>(null);
  const [messageInput, setMessageInput] = useState("");
  const handleMessageInput = (e: ChangeEvent<HTMLInputElement>) =>
    setMessageInput(e.target.value);
  const handleMessageSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await sendPrivateMessage(
      messageInput,
      conversationWith,
      file ? true : false
    );
  };
  const [file, setFile] = useState<File>();
  const fileRef = useRef<File>()
  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.files)
    if (e.target.files?.length === 0) return;
    const f = e.target?.files![0];
    console.log(`F : ` + f)
    if (!f) return;
    setFile(f);
    fileRef.current = f
  };

  useEffect(() => {
    if (!socket) return;

    socket.on(
      "private_message_request_attachment_upload",
      handleUploadConversationAttachment
    );
    socket.on("private_conversation_deleted", handleConversationDeleted);
    socket.on(
      "private_message_attachment_complete",
      handleMessageAttachmentComplete
    );
    socket.on(
      "private_message_attachment_failed",
      handleMessageAttachmentFailed
    );
    socket.on(
      "private_message_attachment_progress",
      handleMessageAttachmentProgress
    );
    return () => {
      socket.off(
        "private_message_attachment_complete",
        handleMessageAttachmentComplete
      );
      socket.off(
        "private_message_attachment_failed",
        handleMessageAttachmentFailed
      );
      socket.off(
        "private_message_attachment_progress",
        handleMessageAttachmentProgress
      );
      socket.off(
        "private_message_request_attachment_upload",
        handleUploadConversationAttachment
      );
      socket.off("private_conversation_deleted", handleConversationDeleted);
    };
  }, [socket]);

  const handleUploadConversationAttachment = useCallback(async (id: string) => {
    console.log("Upload attachment for : " + id + " | File : " + fileRef.current);
    try {
      if (!fileRef.current) throw new Error("No file selected");
      await uploadPrivateMessageAttachment(id, fileRef.current.size, fileRef.current).then(() => setFile(undefined));
    } catch (e) {}
  }, [file]);

  const handleConversationDeleted = useCallback((sender: string) => {
    if (conversationWith === sender) {
      setMessengerSection("Conversations");
    }
    setMessages((p) => [...p.filter((msg) => msg.senderId !== sender)]);
  }, []);

  const handleMessageAttachmentComplete = useCallback(
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

  const handleMessageAttachmentFailed = useCallback((messageId: string) => {
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

  const handleMessageAttachmentProgress = useCallback(
    (progress: number, messageId: string) => {
      console.log("PROGRESS : " + progress + " | MSGID : " + messageId)
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
    <div style={{maxHeight:"50vh"}} className="w-full h-full flex flex-col items-between justify-between">
      {status === "success" && (
        <div className="relative overflow-y-scroll flex flex-col gap-2 grow">
          {messages.map((msg) => (
            <Message
              {...msg}
              key={msg.id}
              otherUser={msg.senderId !== user?.id}
            />
          ))}
          <span ref={messagesBottomRef} className="w-full" />
        </div>
      )}
      {status === "pending" && (
        <ImSpinner8 className="mx-auto my-auto animate-spin text-2xl" />
      )}
      {status === "error" && (
        <div className="flex flex-col gap-2 text-rose-600 gap-2 text-center">
          <MdError />
          {error}
        </div>
      )}
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
