import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { RiDeleteBin4Fill, RiEditBoxFill } from "react-icons/ri";
import { MdError, MdScheduleSend } from "react-icons/md";
import ReactPlayer from "react-player";
import useUsers from "../../../context/UsersContext";
import User from "../../User";
import ProgressBar from "../../ProgressBar";
import { ImDownload3 } from "react-icons/im";
import {
  deletePrivateMessage,
  updatePrivateMessage,
  updateRoomMessage,
  deleteRoomMessage,
  declineInvite,
  acceptInvite,
} from "../../../services/chat";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
  timeStyle: "short",
});

export default function Message({
  otherUser = false,
  message,
  id,
  senderId,
  hasAttachment = false,
  attachmentType,
  attachmentKey,
  attachmentError,
  attachmentProgress,
  attachmentPending,
  createdAt,
  updatedAt,
  roomId,
  isServerMessage,
  isInvite,
}: {
  otherUser?: boolean;
  attachmentType?: string;
  attachmentKey?: string;
  attachmentError?: boolean;
  attachmentProgress?: number;
  attachmentPending?: boolean;
  hasAttachment: boolean;
  message: string;
  id: string;
  senderId?: string; //if there is no senderId that means its a message from the server
  createdAt: Date;
  updatedAt: Date;
  roomId?: string;
  isServerMessage?: boolean;
  isInvite?: boolean;
}) {
  const { getUserData } = useUsers();

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

  const updateMessage = () => {
    if (messageEditInput !== message)
      roomId
        ? updateRoomMessage(id, messageEditInput)
        : updatePrivateMessage(id, messageEditInput);
    setIsEditing(false);
  };

  const getDateString = (date: Date) => dateFormatter.format(date);
  const renderEditedAtTimeString = (dateString: string) => (
    <b style={{ filter: "opacity(0.333)" }} className="pl-2">
      Edited {dateString}
    </b>
  );

  return (
    <div
      aria-label={otherUser ? "Other users message" : "Your message"}
      className={`p-0.5 flex ${
        otherUser ? "flex-row-reverse text-right" : ""
      } items-start`}
    >
      {/* username, pfp & date */}
      <div className="p-1">
        <User
          reverse={isServerMessage || otherUser}
          date={new Date(createdAt)}
          uid={senderId!}
          user={isServerMessage ? undefined : getUserData(senderId!)}
          isServer={isServerMessage}
          chatroomId={roomId}
        />
      </div>
      {/* message content & attachment */}
      <div className="gap-1 grow flex flex-col my-auto px-1">
        {isEditing ? (
          <div
            onMouseEnter={() => setCursorInsideInput(true)}
            onMouseLeave={() => setCursorInsideInput(false)}
            className="flex items-center justify-center"
          >
            <textarea
              className="grow"
              aria-label="Edit comment input"
              value={messageEditInput}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setMessageEditInput(e.target.value)
              }
            />
            <button
              className="px-0 pl-2 bg-transparent"
              aria-label="Update message"
              onClick={() => updateMessage()}
            >
              <MdScheduleSend className="text-lg drop-shadow" />
            </button>
          </div>
        ) : (
          <p className={`leading-3 text-xs my-auto h-full`}>
            {isInvite
              ? `Invitation to ${message.split("INVITATION ")[1]}`
              : <>{message}              {updatedAt !== createdAt &&
                renderEditedAtTimeString(getDateString(new Date(updatedAt)))}</>}
            {isInvite && (
              <div className="gap-0.5 flex w-full justify-end drop-shadow-md my-0.5">
                <button
                  onClick={() =>
                    acceptInvite(senderId!, message.split("INVITATION ")[1])
                  }
                  aria-label="Accept invitation"
                  className="py-0.5 px-0.5 drop-shadow rounded-sm"
                >
                  Accept ✅
                </button>
                <button
                  onClick={() =>
                    declineInvite(senderId!, message.split("INVITATION ")[1])
                  }
                  aria-label="Decline invitation"
                  className="py-0.5 px-0.5 drop-shadow rounded-sm"
                >
                  Decline ❌
                </button>
              </div>
            )}
          </p>
        )}
        {hasAttachment && attachmentType === "Image" && (
          <img
            src={`https://d2gt89ey9qb5n6.cloudfront.net/${process.env.NODE_ENV !== "production" ? "dev." : "" + attachmentKey}`}
            className={"drop-shadow rounded-md mx-auto w-fit h-fit"}
          />
        )}
        {hasAttachment && attachmentType === "Video" && (
          <div className={`overflow-hidden drop-shadow rounded-md grow`}>
            <ReactPlayer
              controls
              width={"100%"}
              height={"auto"}
              url={`https://d2gt89ey9qb5n6.cloudfront.net/${process.env.NODE_ENV !== "production" ? "dev." : "" + attachmentKey}`}
            />
          </div>
        )}
        {typeof attachmentProgress === "number" &&
          attachmentPending &&
          !attachmentError && (
            <div className="px-1">
              <ProgressBar percent={attachmentProgress * 100} />
            </div>
          )}
        {attachmentError && (
          <div
            style={{ filter: "opacity(0.333)" }}
            className={`text-rose-600 font-bold tracking-tight text-xs flex ${
              otherUser ? "flex-row-reverse justify-end" : "justify-start"
            } items-center gap-0.5`}
          >
            <MdError className="text-2xl" />
            Error uploading attachment
          </div>
        )}
        {hasAttachment && attachmentType === "File" && (
          <a
            aria-label="Download attachment"
            download
            href={`https://d2gt89ey9qb5n6.cloudfront.net/${process.env.NODE_ENV !== "production" ? "dev." : "" + attachmentKey}`}
            className={`px-0 ${
              otherUser ? "pr-1" : "pl-1"
            } bg-transparent flex ${
              otherUser ? "flex-row-reverse" : ""
            } text-xs items-center gap-1 text-gray-400 hover:text-black dark:hover:text-white`}
          >
            <ImDownload3 className="text-lg" /> download attachment
          </a>
        )}
      </div>
      {/* edit & delete icons */}
      {!otherUser && (
        <div className="flex flex-col items-center justify-center gap-2 p-0.5 my-auto">
          {!isEditing && !isInvite && (
            <button
              onClick={() => {
                setIsEditing(true);
                setMessageEditInput(message);
              }}
              className="px-0 bg-transparent"
              aria-label="Edit message"
              type="button"
            >
              <RiEditBoxFill className="text-sm drop-shadow" />
            </button>
          )}
          {!isEditing && (
            <button
              onClick={() =>
                roomId ? deleteRoomMessage(id) : deletePrivateMessage(id)
              }
              className="px-0 bg-transparent"
              aria-label={isEditing ? "Submit change" : "Delete message"}
              type="button"
            >
              <RiDeleteBin4Fill className="text-sm text-rose-600 drop-shadow" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
