import { IMessage } from "../../../context/ChatContext";

import { useEffect, useRef } from "react";
import Message from "./Message";
import { useAuth } from "../../../context/AuthContext";
import { ImSpinner8 } from "react-icons/im";
import { MdError } from "react-icons/md";

export default function MessageList({
  messages,
  status,
  error,
  roomId,
}: {
  messages: IMessage[];
  status: "idle" | "pending" | "error" | "success";
  error: unknown;
  roomId?: string;
}) {
  const messagesBottomRef = useRef<HTMLSpanElement>(null);

  const { user } = useAuth();

  useEffect(
    () => messagesBottomRef.current?.scrollIntoView({ behavior: "auto" }),
    [messages]
  );

  return (
    <>
      {status === "success" && (
        <div
          style={{ maxHeight: "20pc" }}
          className="relative overflow-y-scroll flex flex-col gap-2 grow"
        >
          {messages.length > 0 &&
            messages.map((msg) => (
              <Message
                {...msg}
                roomId={roomId}
                key={msg.id}
                isServerMessage={!msg.senderId}
                otherUser={msg.senderId !== user?.id}
              />
            ))}
          <span ref={messagesBottomRef} className="w-full" />
        </div>
      )}
      {status === "pending" && (
        <ImSpinner8 className="mx-auto my-2 animate-spin text-2xl" />
      )}
      {status === "error" && (
        <div className="flex flex-col gap-2 text-rose-600 gap-2 text-center">
          <>
            <MdError />
            {`${error}`}
          </>
        </div>
      )}
    </>
  );
}
