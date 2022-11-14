import Message from "./Message";
import MessageForm from "./MessageForm";

import { useCallback, useEffect, useState, useRef } from "react";
import type { FormEvent, ChangeEvent, MutableRefObject } from "react";
import { getConversation, uploadAttachment } from "../../../services/messenger";
import { useSocket } from "../../../context/SocketContext";
import { useAuth } from "../../../context/AuthContext";

export interface IMessage {
  id: string;
  message: string;
  senderId: string;
  hasAttachment: boolean;
  attachmentType?: string;
  attachmentKey?: string;
  attachmentPending?: boolean;
  attachmentError?: boolean;
  attachmentProgress?: number;
}

export default function ConversationSection({
  setMessengerSection,
  conversationWith = "",
}: {
  setMessengerSection: Function;
  conversationWith: string;
}) {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [resMsg, setResMsg] = useState({ msg: "", err: false, pen: false });
  const [messages, setMessages] = useState<IMessage[]>([]);

  const messagesBottomRef = useRef<HTMLSpanElement>(null);
  const [messageInput, setMessageInput] = useState("");
  const handleMessageInput = (e: ChangeEvent<HTMLInputElement>) =>
    setMessageInput(e.target.value);
  const handleMessageSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      socket?.emit(
        "private_message",
        messageInput,
        conversationWith,
        file ? true : false
      );
    } catch (e) {
      setResMsg({ msg: `${e}`, err: true, pen: false });
    }
  };
  const file = useRef<File>();
  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length === 0) return;
    //@ts-ignore
    const f = Array.from(e.target.files!)[0];
    console.log(f)
    if(!f) return
    //@ts-ignore
    file.current = f;
  };

  useEffect(() => {
    getConversation(conversationWith)
      .then((messages) => {
        setResMsg({ msg: "", err: false, pen: false });
        setMessages(messages);
      })
      .catch((e) => {
        setResMsg({ msg: `${e}`, err: true, pen: false });
      });
    if (!socket) return;

    socket.on(
      "private_message_request_attachment_upload",
      handleUploadAttachment
    );

    socket.on("private_message", handleMessage);
    socket.on("private_message_delete", handleMessageDelete);
    socket.on("private_message_update", handleMessageUpdate);
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
      socket.off("private_message", handleMessage);
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
      socket.off("private_message_delete", handleMessageDelete);
      socket.off("private_message_update", handleMessageUpdate);
      socket.off(
        "private_message_request_attachment_upload",
        handleUploadAttachment
      );
    };
  }, [socket]);

  const handleMessage = useCallback(
    (
      id: string,
      message: string,
      senderId: string,
      hasAttachment: boolean,
      attachmentType?: string,
      attachmentError?: boolean,
      attachmentKey?: string,
      attachmentPending?: boolean,
      attachmentProgress?: number
    ) => {
      setMessages((p) => [
        ...p,
        {
          id,
          message,
          senderId,
          hasAttachment,
          attachmentKey,
          attachmentError,
          attachmentType,
          attachmentPending,
          attachmentProgress: attachmentProgress || 0,
        },
      ]);
      messagesBottomRef.current?.scrollIntoView({ behavior: "auto" });
    },
    []
  );

  const handleUploadAttachment = useCallback(async (id: string) => {
    try {
      setResMsg({ msg: "", err: false, pen: true });
      if(!file.current) throw new Error("No file selected")
      await uploadAttachment(id, file.current.size, file.current);
      setResMsg({ msg: "", err: false, pen: false });
    } catch (e) {
      console.log("error : " + e)
      setResMsg({ msg: `${e}`, err: true, pen: false });
    }
  }, [file]);

  const handleMessageDelete = useCallback((id: string) => {
    setMessages((p) => [...p.filter((msg) => msg.id !== id)]);
  }, []);

  const handleMessageUpdate = useCallback((id: string, message: string) => {
    setMessages((p) => {
      let newMsgs = p;
      const i = newMsgs.findIndex((msg) => msg.id === id);
      newMsgs[i].message = message;
      return [...newMsgs];
    });
  }, []);

  const handleMessageAttachmentComplete = useCallback(
    (messageId: string, type: string, key: string) => {
      setMessages((p) => {
        let newMsgs = p;
        const i = newMsgs.findIndex((msg) => msg.id === messageId);
        newMsgs[i] = {
          ...newMsgs[i],
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
          attachmentProgress: progress,
        };
        return [...newMsgs];
      });
    },
    []
  );

  return (
    <div className="w-full h-full flex flex-col items-between justify-between">
      <div className="grow overflow-y-scroll">
        {messages.map((msg) => (
          <Message
            message={msg.message}
            key={msg.id}
            id={msg.id}
            senderId={msg.senderId}
            otherUser={msg.senderId !== user?.id}
          />
        ))}
        <span ref={messagesBottomRef} />
      </div>
      <MessageForm
        file={file.current}
        handleFileInput={handleFileInput}
        handleMessageInput={handleMessageInput}
        handleMessageSubmit={handleMessageSubmit}
        handleBackClicked={() => setMessengerSection("Conversations")}
        messageInput={messageInput}
      />
    </div>
  );
}
