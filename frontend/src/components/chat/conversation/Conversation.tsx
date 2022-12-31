import MessageForm from "../messages/MessageForm";

import useCustomArrayAsync from "../../../hooks/useCustomArrayAsync";

import { useCallback, useEffect, useState, useRef } from "react";
import type { FormEvent, ChangeEvent } from "react";

import {
  getConversation,
  conversationOpenVideoChat,
  sendPrivateMessage,
  uploadPrivateMessageAttachment,
} from "../../../services/chat";

import { useSocket } from "../../../context/SocketContext";
import { IMessage, useChat } from "../../../context/ChatContext";

import MessageList from "../messages/MessageList";
import MessengerError from "../MessengerError";

import Peer from "simple-peer";
import * as process from "process";
import Videos from "../video/Videos";
(window as any).process = process;

const ICE_Config = {
  iceServers: [
    {
      urls: "stun:openrelay.metered.ca:80",
    },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

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
  const { setChatSection, initVideo, userStream } = useChat();

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
    socket.emit("private_conversation_open", conversationWith);
    socket.on("private_conversation_deleted", handleConversationDeleted);
    socket.on("private_message_attachment_complete", handleAttachmentComplete);
    socket.on("private_message_attachment_failed", handleAttachmentFailed);
    socket.on("private_message_attachment_progress", handleAttachmentProgress);
    socket.on("private_conversation_video_chat_user", handleReceiveVideoCall);
    socket.on(
      "private_conversation_video_chat_user_joined",
      handleVidChatUserJoined
    );
    socket.on(
      "private_conversation_video_chat_receiving_returned_signal",
      handleVidChatReceivingReturningSignal
    );
    socket.on(
      "private_conversation_video_chat_user_left",
      handleVidChatUserLeft
    );
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
      socket.off(
        "private_conversation_video_chat_user",
        handleReceiveVideoCall
      );
      socket.off(
        "private_conversation_video_chat_user_joined",
        handleVidChatUserJoined
      );
      socket.off(
        "private_conversation_video_chat_receiving_returned_signal",
        handleVidChatReceivingReturningSignal
      );
      socket.off(
        "private_conversation_video_chat_user_left",
        handleVidChatUserLeft
      );
      socket.emit("private_conversation_close");
    };
  }, [socket]);

  const handleUploadAttachment = useCallback(
    async (id: string) => {
      try {
        if (!fileRef.current) return;
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

  ///////////////////////////// Video chat stuff /////////////////////////////
  const peerRef = useRef<{ peerSID: string; peer: Peer.Instance }>();
  const [peer, setPeer] = useState<{ peerSID: string; peer: Peer.Instance }>();
  const [isStreaming, setIsStreaming] = useState(false);
  const handleVidChatClicked = () => {
    initVideo()
      .then(() => {
        setIsStreaming(true);
        conversationOpenVideoChat(conversationWith).catch((e: unknown) =>
          setErr(`${e}`)
        );
      })
      .catch((e) => setErr(`${e}`));
  };
  const handleReceiveVideoCall = useCallback((sid: string) => {
    const peer = createPeer(sid);
    peerRef.current = {
      peerSID: sid,
      peer,
    };
    setPeer({ peer, peerSID: sid });
  }, []);
  const handleVidChatUserJoined = useCallback(
    (signal: Peer.SignalData, callerSid: string) => {
      const peer = addPeer(signal, userStream?.current, callerSid);
      setPeer({ peer, peerSID: callerSid });
      peerRef.current = {
        peerSID: callerSid,
        peer,
      };
    },
    []
  );
  const handleVidChatReceivingReturningSignal = (signal: Peer.SignalData) => {
    setTimeout(() => {
      peerRef.current?.peer.signal(signal);
    });
  };
  const handleVidChatUserLeft = () => {
    peerRef.current?.peer.destroy();
    setPeer(undefined);
    peerRef.current = undefined;
  };
  const createPeer = (sid: string) => {
    if (typeof userStream?.current === "undefined")
      throw new Error("Media stream is undefined");
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: userStream.current,
      config: ICE_Config,
    });

    peer.on("signal", (signal) => {
      socket?.emit("private_conversation_video_chat_sending_signal", {
        userToSignal: conversationWith,
        signal,
      });
    });
    return peer;
  };
  const addPeer = (
    incomingSignal: Peer.SignalData,
    stream: MediaStream | undefined,
    callerSid: string
  ) => {
    if (typeof stream === "undefined")
      throw new Error("Media stream is undefined");
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: ICE_Config,
    });
    peer.on("signal", (signal) => {
      socket?.emit("private_conversation_video_chat_returning_signal", {
        signal,
        callerSid,
      });
    });
    setTimeout(() => {
      peer.signal(incomingSignal);
    });
    return peer;
  };

  return (
    <div className="w-full h-full flex flex-col items-between justify-between">
      {(isStreaming || peer) && (
        <Videos
          windowSize="1/2"
          peersData={peer ? [{ ...peer, peerUID: conversationWith }] : []}
        />
      )}
      <MessageList messages={messages} status={status} error={error} />
      {err && <MessengerError err={err} closeError={() => setErr("")} />}
      <MessageForm
        file={file}
        handleFileInput={handleFileInput}
        handleMessageInput={handleMessageInput}
        handleMessageSubmit={handleMessageSubmit}
        messageInput={messageInput}
        handleVidChatIconClicked={handleVidChatClicked}
      />
    </div>
  );
}
