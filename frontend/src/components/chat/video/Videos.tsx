import VideoChatWindow from "./VideoChatWindow";
import useScrollbarSize from "react-scrollbar-size";
import { useAuth } from "../../../context/AuthContext";
import { PeerWithIDs } from "../room/Room";
import { useChat } from "../../../context/ChatContext";

/*
  For the client only stream and UID are used, peer is left undefined.

  For other streams the stream is received from the peer, UID is still
  required.
*/

export default function Videos({ peersData }: { peersData: PeerWithIDs[] }) {
  const { width: scrollWidth } = useScrollbarSize();
  const { user } = useAuth();
  const { userStream } = useChat();

  return (
    <div
      style={{
        width: `calc(100% - ${scrollWidth}px)`,
        background: "rgba(0,0,0,0.75)",
      }}
      className="w-full absolute p-0.5 flex border-b border-stone-600 dark:border-stone-800 flex-wrap z-40"
    >
      {user && userStream && (
        <VideoChatWindow uid={user.id} stream={userStream.current} />
      )}
      {peersData.map((vidWinData) => (
        <VideoChatWindow
          uid={vidWinData.peerUID}
          key={vidWinData.peerSID}
          peer={vidWinData.peer}
        />
      ))}
    </div>
  );
}
