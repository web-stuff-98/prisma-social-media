import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { RiDeleteBin4Fill, RiEditBoxFill } from "react-icons/ri";
import { MdScheduleSend } from "react-icons/md";
import ReactPlayer from "react-player";
import { useSocket } from "../../../context/SocketContext";
import useUsers from "../../../context/UsersContext";
import User from "../../User";
import ProgressBar from "../../ProgressBar";
import { ImDownload3 } from "react-icons/im";

/**
 * attachmentData = {
 *      type: "Video" || "Image" || "File"
 *      url: the url for the attachment
 * }
 */

export interface IAttachmentData {
  url: string;
  type: "Video" | "Image" | "File";
  progress: number;
  failed: boolean;
  complete: boolean;
}

export default function Message({
  otherUser = false,
  attachmentData = null,
  message,
  id,
  senderId,
}: {
  otherUser?: boolean;
  attachmentData?: IAttachmentData | null;
  message: string;
  id: string;
  senderId: string;
}) {
  const { getUserData } = useUsers();
  const { socket } = useSocket();

  const [isEditing, setIsEditing] = useState(false);
  const [cursorInsideInput, setCursorInsideInput] = useState(false);
  const [messageEditInput, setMessageEditInput] = useState("");

  useEffect(() => {
    const clicked = () => {
      if (!cursorInsideInput) {
        setIsEditing(false);
      }
    };
    document.addEventListener("mousedown", clicked);
    return () => {
      document.removeEventListener("mousedown", clicked);
    };
  }, [cursorInsideInput]);

  return (
    <div
      onMouseEnter={() => setCursorInsideInput(true)}
      onMouseLeave={() => setCursorInsideInput(false)}
      className={`p-0.5 mb-2 flex ${
        otherUser ? "flex-row-reverse text-right" : ""
      } items-start`}
    >
      {/* username, pfp & date */}
      <div className="p-1">
        <User reverse={otherUser} uid={senderId} user={getUserData(senderId)} />
      </div>
      {/* message content & attachment */}
      <div className="gap-1 grow flex flex-col my-auto px-1">
        {attachmentData && attachmentData.type === "Image" && (
          <div
            style={{
              backgroundImage: `url(${attachmentData.url})`,
              backgroundPosition: otherUser ? "right" : "left",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
            }}
            className={`w-full h-24 ${otherUser ? "pr-2" : "pl-2"}`}
          />
        )}
        {isEditing ? (
          <textarea
            value={messageEditInput}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setMessageEditInput(e.target.value)
            }
          />
        ) : (
          <p className={`leading-3 text-xs my-auto h-full`}>{message}</p>
        )}
        {attachmentData && attachmentData.type === "Video" && (
          <div className={`overflow-hidden rounded`}>
            <ReactPlayer width={"100%"} height={100} url={attachmentData.url} />
          </div>
        )}
        {attachmentData && !attachmentData.complete && !attachmentData.failed && (
          <div className="px-1">
            <ProgressBar percent={attachmentData?.progress} />
          </div>
        )}
        {/*attachmentData && attachmentData.type === "File"*/}
        {true && <button aria-label="Download attachment" className={`px-0 ${otherUser ? "pr-1" : "pl-1"} bg-transparent flex ${otherUser ? "flex-row-reverse" : ""} text-xs items-center gap-1 text-gray-400 hover:text-black`}><ImDownload3 className="text-lg"/> download attachment</button>}
      </div>
      {/* edit & delete icons */}
      {!otherUser && (
        <div className="flex flex-col items-center justify-center gap-1 p-0.5 my-auto">
          {!isEditing && (
            <button
              onClick={() => {
                setIsEditing(true);
                setMessageEditInput(message);
              }}
              className="px-0 bg-transparent"
              aria-label="Edit message"
              type="button"
            >
              <RiEditBoxFill className="text-lg drop-shadow" />
            </button>
          )}
          <button
            onClick={() => {
              if (!isEditing) socket?.emit("private_message_delete", id);
              else {
                socket?.emit("private_message_update", id, messageEditInput);
                setIsEditing(false);
              }
            }}
            className="px-0 bg-transparent"
            aria-label={isEditing ? "Submit change" : "Delete message"}
            type="button"
          >
            {isEditing ? (
              <MdScheduleSend className="text-lg drop-shadow" />
            ) : (
              <RiDeleteBin4Fill className="text-lg text-rose-600 drop-shadow" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
