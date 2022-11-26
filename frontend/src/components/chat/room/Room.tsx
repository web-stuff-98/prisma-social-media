import MessageForm from "../messages/MessageForm";
import { useState, useRef, useEffect, useCallback } from "react";
import { ChangeEvent, FormEvent } from "react";
import {
  getRoomMessages,
  leaveRoom,
  roomOpenVideoChat,
  sendRoomMessage,
  uploadRoomMessageAttachment,
} from "../../../services/chat";
import MessageList from "../messages/MessageList";
import useCustomArrayAsync from "../../../hooks/useCustomArrayAsync";
import { IMessage, useChat } from "../../../context/ChatContext";
import { useSocket } from "../../../context/SocketContext";
import MessengerError from "../MessengerError";
import useUsers from "../../../context/UsersContext";
import Videos from "../video/Videos";
import { IUser, useAuth } from "../../../context/AuthContext";

import Peer from "simple-peer";
import * as process from "process";
(window as any).process = process;

/**
 * For some reason that does not make any sense to me the
 * only way to get video chat to work was to wrap both
 * occurances of peer.signal in a setTimeout. It took
 * 2 days to figure this out by trying random stuff.
 * At least it works now.
 */

export interface PeerWithIDs {
  peerSID: string;
  peerUID: string;
  peer: Peer.Instance;
}

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

export default function Room({ roomId }: { roomId: string }) {
  const { rooms, setTopText } = useChat();
  const { socket } = useSocket();
  const { getUserData } = useUsers();

  const getAuthorName = (userData?: IUser) => {
    return userData ? userData.name : "";
  };

  const [err, setErr] = useState("");

  useEffect(() => {
    const found = rooms.find((r) => r.id === roomId);
    if (found)
      setTopText(
        `${found?.name} - by ${getAuthorName(getUserData(found.authorId))}`
      );
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
        if (!fileRef.current) throw new Error("No file selected");
        await uploadRoomMessageAttachment(
          id,
          fileRef.current.size,
          fileRef.current
        ).then(() => setFile(undefined));
      } catch (e) {
        setErr(`${e}`);
      }
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
    []
  );

  ///////////////////////////////////// Video chat stuff /////////////////////////////////////
  const peersRef = useRef<PeerWithIDs[]>([]);
  const [peers, setPeers] = useState<PeerWithIDs[]>([]);
  const userStream = useRef<MediaStream | undefined>(undefined);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selfMuted, setSelfMuted] = useState(false);
  const toggleMuteSelf = () => {
    const audioTracks = userStream.current?.getAudioTracks();
    if (audioTracks) {
      for (const track of audioTracks) {
        setSelfMuted(!track.enabled);
        track.enabled = !track.enabled;
      }
    }
  };
  const initVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      return stream;
    } catch (e) {
      if (`${e}`.includes("NotFoundError")) {
        throw new Error("Camera could not be found");
      } else {
        throw new Error(`${e}`);
      }
    }
  };
  const handleVidChatClicked = async () => {
    try {
      const stream = await initVideo();
      userStream.current = stream;
      setIsStreaming(true);
      await roomOpenVideoChat(roomId);
    } catch (e) {
      setErr(`${e}`);
    }
  };
  const handleVidChatAllUsers = useCallback(
    (ids: { sid: string; uid: string }[]) => {
      const peers: PeerWithIDs[] = [];
      ids.forEach((ids) => {
        console.log(`createPeer userStream : ${userStream.current}`);
        const peer = createPeer(
          ids.sid,
          String(socket?.id),
          userStream.current
        );
        peersRef.current.push({
          peerSID: ids.sid,
          peerUID: ids.uid,
          peer,
        });
        peers.push({ peer, peerSID: ids.sid, peerUID: ids.uid });
      });
      setPeers(peers);
    },
    []
  );
  const handleVidChatUserJoined = useCallback(
    (signal: any, callerSid: string, callerUid: string) => {
      console.log(`addPeer userStream : ${userStream.current}`);
      const peer = addPeer(signal, callerSid, userStream.current);
      setPeers((peers: PeerWithIDs[]) => [
        ...peers,
        { peer, peerSID: callerSid, peerUID: callerUid },
      ]);
      peersRef.current.push({
        peerSID: callerSid,
        peerUID: callerUid,
        peer,
      });
    },
    []
  );
  const handleVidChatReceivingReturningSignal = (
    signal: Peer.SignalData,
    sid: string
  ) => {
    const item = peersRef.current.find((p) => p.peerSID === sid);
    setTimeout(() => {
      item?.peer.signal(signal);
    });
  };
  const handleVidChatUserLeft = (uid: string) => {
    const peerRef = peersRef.current.find((p) => p.peerUID === uid);
    peerRef?.peer.destroy();
    setPeers((peers) => peers.filter((p) => p.peerUID !== uid));
    peersRef.current = peersRef.current.filter(
      (p: PeerWithIDs) => p.peerUID !== uid
    );
  };
  const createPeer = (
    userToSignal: string,
    callerSid: string,
    stream: MediaStream | undefined
  ) => {
    if (typeof stream === "undefined")
      console.warn("Media stream is undefined");
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
      config: ICE_Config,
    });
    peer.on("signal", (signal) => {
      socket?.emit("room_video_chat_sending_signal", {
        userToSignal,
        callerSid,
        signal,
      });
    });
    return peer;
  };
  const addPeer = (
    incomingSignal: Peer.SignalData,
    callerSid: string,
    stream: MediaStream | undefined
  ) => {
    if (typeof stream === "undefined")
      console.warn("Media stream is undefined");
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
      config: ICE_Config,
    });
    peer.on("signal", (signal) => {
      socket?.emit("room_video_chat_returning_signal", { signal, callerSid });
    });
    setTimeout(() => {
      peer.signal(incomingSignal);
    });
    return peer;
  };
  useEffect(() => {
    socket?.on("room_video_chat_all_users", handleVidChatAllUsers);
    socket?.on("room_video_chat_user_joined", handleVidChatUserJoined);
    socket?.on(
      "room_video_chat_receiving_returned_signal",
      handleVidChatReceivingReturningSignal
    );
    socket?.on("room_video_chat_user_left", handleVidChatUserLeft);
    return () => {
      socket?.off("room_video_chat_all_users", handleVidChatAllUsers);
      socket?.off("room_video_chat_user_joined", handleVidChatUserJoined);
      socket?.off(
        "room_video_chat_receiving_returned_signal",
        handleVidChatReceivingReturningSignal
      );
      socket?.off("room_video_chat_user_left", handleVidChatUserLeft);
      for (const p of peersRef.current) {
        p.peer.destroy();
      }
      leaveRoom(roomId);
    };
  }, []);

  return (
    <div>
      <>
        {(isStreaming || peers.length > 0) && (
          <Videos selfMuted={selfMuted} toggleMuteSelf={toggleMuteSelf} usersStream={userStream.current} peersData={peers} />
        )}
        <MessageList
          roomId={roomId}
          messages={messages}
          error={error}
          status={status}
        />
        {err && <MessengerError closeError={() => setErr("")} err={err} />}
        <MessageForm
          handleVidChatIconClicked={handleVidChatClicked}
          handleMessageSubmit={handleMessageSubmit}
          messageInput={messageInput}
          handleFileInput={handleFileInput}
          handleMessageInput={handleMessageInput}
          file={file}
        />
      </>
    </div>
  );
}

/*<Videos
vidWindowsData={(isStreaming
  ? [{ stream: userStream.current, uid: String(user?.id) }]
  : []
).concat(
  peers.map((peer) => ({
    peer: peer.peer,
    stream: undefined,
    uid: peer.peerUID,
  }))
)}
/>*/
