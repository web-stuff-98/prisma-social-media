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

export interface IMessage {
  id: string;
  message: string;
  senderId: string;
  recipientId?: string; //recipientId doesn't actually exist for messages retrieved from getConversations, but this needs to be in the interface so that messages from other users can be filtered out because the event will still receive messages from other users
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
    },
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
  const file = useRef<File>();
  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length === 0) return;
    //@ts-ignore
    const f = Array.from(e.target.files!)[0];
    if (!f) return;
    //@ts-ignore
    file.current = f;
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

  const handleUploadConversationAttachment = useCallback(
    async (id: string) => {
      try {
        //setResMsg({ msg: "", err: false, pen: true });
        if (!file.current) throw new Error("No file selected");
        await uploadPrivateMessageAttachment(
          id,
          file.current.size,
          file.current
        );
        //setResMsg({ msg: "", err: false, pen: false });
      } catch (e) {
        //setResMsg({ msg: `${e}`, err: true, pen: false });
      }
    },
    [file]
  );

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
      setMessages((p) => {
        let newMsgs = p;
        const i = newMsgs.findIndex((msg) => msg.id === messageId);
        newMsgs[i] = {
          ...newMsgs[i],
          attachmentProgress: Math.max(5, progress),
        };
        return [...newMsgs];
      });
    },
    []
  );

  return (
    <div className="w-full h-full flex flex-col items-between justify-between">
      <div className="relative overflow-y-scroll grow">
        {messages.map((msg) => (
          <Message
            {...msg}
            key={msg.id}
            otherUser={msg.senderId !== user?.id}
          />
        ))}
        <span ref={messagesBottomRef} className="w-full"/>
      </div>
      {/*resMsg.err && (
        <span className="bg-rose-600 text-white flex items-center p-1">
          <MdError className="text-3xl" />
          {resMsg.err}
        </span>
      )*/}
      <MessageForm
        file={file.current}
        handleFileInput={handleFileInput}
        handleMessageInput={handleMessageInput}
        handleMessageSubmit={handleMessageSubmit}
        messageInput={messageInput}
      />
    </div>
  );
}
