import { useMessenger } from "../../context/MessengerContext";
import { IconBtn } from "../IconBtn";

import { BsMic, BsMicMute } from "react-icons/bs";

export default function VideoChatWindow() {
  const { streamWindowsOffset } = useMessenger();
  return (
    <div
      aria-label="Partner stream"
      style={streamWindowsOffset}
      className="w-36 h-28 rounded-sm shadow overflow-hidden bg-white absolute m-1 border flex flex-col"
    >
      <span
        style={{ background: "rgba(0,0,0,0.333)" }}
        aria-label="Partner stream controls"
        className="absolute shadow-md py-1 w-full flex items-center justify-end border-b"
      >
        <IconBtn Icon={BsMic} />
      </span>
    </div>
  );
}
