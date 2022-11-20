import { useState, useEffect, useCallback } from "react";
import type { FormEvent, ChangeEvent } from "react";

import { createRoom, getRooms, joinRoom } from "../../../services/chat";

import { MdError, MdSend } from "react-icons/md";
import { ImSpinner8 } from "react-icons/im";
import { TbDoorOff, TbDoor } from "react-icons/tb";

import useCustomArrayAsync from "../../../hooks/useCustomArrayAsync";
import { IconBtn } from "../../IconBtn";
import { IRoom, useChat } from "../../../context/ChatContext";
import { useSocket } from "../../../context/SocketContext";

export default function Rooms({
  setRoomId = () => {},
}: {
  setRoomId: (to: string) => void;
}) {
  const { socket } = useSocket();
  const { setChatSection } = useChat();

  const {
    error: roomsError,
    status: roomsStatus,
    value: rooms,
  } = useCustomArrayAsync(
    getRooms,
    [],
    "room_updated",
    "room_deleted",
    "room_created"
  );

  const [resMsg, setResMsg] = useState({ msg: "", err: false, pen: false });

  const [nameInput, setNameInput] = useState("");
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setResMsg({ msg: "", err: false, pen: true });
      await createRoom(nameInput);
      setResMsg({ msg: "", err: false, pen: false });
    } catch (e) {
      setResMsg({ msg: `${e}`, err: true, pen: false });
    }
  };

  const handleUserJoined = useCallback((uid: string) => {}, []);
  const handleUserLeft = useCallback((uid: string) => {}, []);
  const handleUserKicked = useCallback((uid: string) => {}, []);
  const handleUserBanned = useCallback((uid: string) => {}, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("room_user_joined", handleUserJoined);
    socket.on("room_user_banned", handleUserBanned);
    socket.on("room_user_kicked", handleUserKicked);
    socket.on("room_user_left", handleUserLeft);
    return () => {
      socket.off("room_user_joined", handleUserJoined);
      socket.off("room_user_banned", handleUserBanned);
      socket.off("room_user_kicked", handleUserKicked);
      socket.off("room_user_left", handleUserLeft);
    };
  }, [socket]);

  return (
    <>
      <div className="flex flex-col items-center justify-start">
        {roomsStatus === "pending" && (
          <ImSpinner8 className="drop-shadow animate-spin text-2xl my-2" />
        )}
        {(resMsg.err || roomsStatus === "error") && (
          <div className="text-lg text-rose-600 drop-shadow text-center flex flex-col items-center justify-center">
            <MdError className="text-2xl" />
            {resMsg.err || roomsError}
          </div>
        )}
        <div className="flex flex-col justify-start gap-1 p-1 w-full">
          {rooms.map((room: IRoom) => (
            <article
              key={room.id}
              style={room.public ? {} : { filter: "opacity(0.5)" }}
              className="leading-5 flex justify-between items-center text-xs font-bold rounded-sm border dark:border-stone-800 shadow px-1 w-full py-1"
            >
              <div>{room.name}</div>
              <div className="text-lg">
                <IconBtn
                  aria-label="Join room"
                  onClick={() =>
                    joinRoom(room.id).then(() => {
                      setChatSection("Chatroom");
                      setRoomId(room.id);
                    })
                  }
                  Icon={room.public ? TbDoor : TbDoorOff}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
      <form
        aria-label="Create room form"
        onSubmit={handleSubmit}
        className="w-full p-1 border-t dark:border-stone-800 flex items-center justify-between"
      >
        <input
          id="Create room name input"
          name="Create room name input"
          value={nameInput}
          className="grow rounded-sm border dark:border-stone-800 px-1 mr-1"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setNameInput(e.target.value)
          }
          aria-label="Create room"
          type="text"
          placeholder="Create room..."
          required
        />
        <button
          aria-label="Submit"
          type="submit"
          className="text-2xl bg-transparent px-0 pr-1"
        >
          <MdSend />
        </button>
      </form>
    </>
  );
}
