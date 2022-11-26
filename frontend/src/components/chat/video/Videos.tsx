import VideoChatWindow from "./VideoChatWindow";
import useScrollbarSize from "react-scrollbar-size";
import { useAuth } from "../../../context/AuthContext";

import { PeerWithIDs } from "../room/Room";

/*
  For the client only stream and UID are used, peer is left undefined.

  For other streams the stream is received from the peer, UID is still
  required.
*/

export default function Videos({
  peersData,
  usersStream,
  toggleMuteSelf,
  selfMuted,
}: {
  peersData: PeerWithIDs[];
  usersStream?: MediaStream;
  toggleMuteSelf?: () => void,
  selfMuted?: boolean
}) {
  const { width: scrollWidth } = useScrollbarSize();
  const { user } = useAuth();

  return (
    <div
      style={{
        width: `calc(100% - ${scrollWidth}px)`,
        background: "rgba(0,0,0,0.666)",
      }}
      className="w-full absolute p-0.5 flex border-b border-stone-600 dark:border-stone-800 flex-wrap z-40"
    >
      {user && usersStream && (
        <VideoChatWindow selfMuted={selfMuted} toggleMuteSelf={toggleMuteSelf} uid={user.id} stream={usersStream} />
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
