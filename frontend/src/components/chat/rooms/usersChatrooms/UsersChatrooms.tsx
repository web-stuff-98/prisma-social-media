import { useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useChat } from "../../../../context/ChatContext";
import Room from "../Room";

export default function UsersChatrooms() {
  const { rooms } = useChat();
  const { user } = useAuth();

  return (
    <div className="w-full h-full">
      <div className="flex flex-col justify-start gap-1 p-1 w-full">
        {rooms
          .filter((room) => room.authorId === user?.id)
          .map((r) => (
            <Room key={r.id} room={r} />
          ))}
      </div>
    </div>
  );
}
