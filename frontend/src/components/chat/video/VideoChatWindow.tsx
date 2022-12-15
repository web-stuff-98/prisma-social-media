import { IconBtn } from "../../IconBtn";

import { useRef, useEffect, useState } from "react";

import { BsMic, BsMicMute } from "react-icons/bs";
import { TfiFullscreen } from "react-icons/tfi";

import { useAuth } from "../../../context/AuthContext";

import Peer from "simple-peer";
import { ImSpinner8 } from "react-icons/im";
import User from "../../User";
import useUsers from "../../../context/UsersContext";
import { useChat } from "../../../context/ChatContext";

/*
  For the client only stream and UID are used, peer is left undefined.

  For other streams the stream is received from the peer, UID is still
  required.
*/

export default function VideoChatWindow({
  size,
  stream,
  uid,
  peer,
}: {
  size: "1/4" | "1/3" | "1/2"
  stream?: MediaStream;
  uid: string;
  peer?: Peer.Instance;
}) {
  const { user } = useAuth();
  const { getUserData } = useUsers();
  const { selfMuted, toggleMuteSelf} = useChat()

  const videoRef = useRef<HTMLVideoElement | any>();

  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      setStreaming(true);
    }
  }, [stream]);

  const handleStream = (stream: MediaStream) => {
    videoRef.current.srcObject = stream;
    setStreaming(true);
  };

  useEffect(() => {
    peer?.on("stream", handleStream);
    return () => {
      peer?.off("stream", handleStream);
    };
  }, []);

  const [muted, setMuted] = useState(false);

  return (
    <div style={{maxWidth:"50%"}} className={`w-${size} p-0.5 z-50`}>
      <div className="relative h-full w-full rounded shadow overflow-hidden bg-foreground dark:bg-darkmodeForeground border border-zinc-600 dark:border-stone-800 flex flex-col">
        <span
          aria-label="Partner stream controls"
          className="absolute pl-0.5 bg-stone-900 border-b border-stone-800 text-white shadow-md py-1 w-full h-6 flex items-center justify-between"
        >
          <User micro uid={uid} user={getUserData(uid)} />
          <div className="flex gap-0.5 pr-0.5">
            <IconBtn
              onClick={() => {
                if (uid !== user?.id) {
                  setMuted(!muted);
                } else if (toggleMuteSelf) {
                  toggleMuteSelf();
                }
              }}
              Icon={
                (typeof selfMuted !== undefined ? selfMuted : muted)
                  ? BsMicMute
                  : BsMic
              }
            />
            <IconBtn
              onClick={() => {
                videoRef.current.requestFullscreen();
              }}
              Icon={TfiFullscreen}
            />
          </div>
        </span>
        <video
          muted={uid === user?.id || muted}
          autoPlay
          playsInline
          ref={videoRef}
          style={{
            ...(streaming
              ? { filter: "opacity(1)" }
              : { filter: "opacity(0)" }),
            transition: "filter 150ms ease",
          }}
          className="mt-6 z-20 grow"
        />
        <div
          style={{
            ...(streaming
              ? { filter: "opacity(0)" }
              : { filter: "opacity(1)" }),
            transition: "filter 150ms ease",
          }}
          className="absolute w-full h-full mt-6 h-11 flex items-center justify-center"
        >
          <ImSpinner8 className="animate-spin drop-shadow text-2xl grow" />
        </div>
      </div>
    </div>
  );
}
