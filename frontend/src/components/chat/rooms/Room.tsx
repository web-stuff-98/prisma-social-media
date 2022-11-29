import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { IRoom, useChat } from "../../../context/ChatContext";
import { joinRoom } from "../../../services/chat";
import { IconBtn } from "../../IconBtn";

import { TbDoor, TbDoorOff } from "react-icons/tb";
import { RiSettings4Fill } from "react-icons/ri";

export default function Room({ room, setErr }: { room: IRoom, setErr: (to:string) => void }) {
  const { user } = useAuth();
  const { setChatSection, setRoomId, openRoomEditor } = useChat();

  return (
    <div
      style={
        room.public || room.authorId === user?.id
          ? {}
          : { filter: "opacity(0.5)" }
      }
      className="leading-5 flex justify-between items-center text-xs font-bold rounded-sm border dark:border-stone-800 shadow px-1 w-full py-1"
    >
      <div>{room.name}</div>
      <div className="text-lg flex">
        {user?.id === room.authorId && (
          <IconBtn
            onClick={() => openRoomEditor(room.id)}
            aria-label="Room settings"
            Icon={RiSettings4Fill}
          />
        )}
        <IconBtn
          aria-label="Join room"
          onClick={() =>
            joinRoom(room.id)
              .then(() => {
                setChatSection("Chatroom");
                setRoomId(room.id);
              })
              .catch((e) => setErr(`${e}`))
          }
          Icon={room.public ? TbDoor : TbDoorOff}
        />
      </div>
    </div>
  );
}
