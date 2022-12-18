import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";

import { createRoom } from "../../../services/chat";

import { MdError, MdSend } from "react-icons/md";
import { ImSpinner8 } from "react-icons/im";

import { IRoom, useChat } from "../../../context/ChatContext";
import MessengerError from "../MessengerError";
import Room from "./Room";

export default function Rooms() {
  const { rooms, roomsError, roomsStatus } =
    useChat();

  const [err, setErr] = useState("");

  const [nameInput, setNameInput] = useState("");
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setErr("");
      await createRoom(nameInput);
    } catch (e) {
      setErr(`${e}`);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-start">
        {roomsStatus === "pending" && (
          <ImSpinner8 className="drop-shadow animate-spin text-2xl my-2" />
        )}
        {roomsStatus === "error" && (
          <div className="text-lg text-rose-600 drop-shadow text-center flex flex-col items-center justify-center">
            <>
              <MdError className="text-2xl mt-2 mb-0" />
              {roomsError}
            </>
          </div>
        )}
        <div style={{maxHeight:"20rem"}} className="flex overflow-y-auto flex-col justify-start gap-1 p-1 w-full">
          {rooms && rooms.map((room: IRoom) => (
            <Room setErr={setErr} key={room.id} room={room} />
          ))}
        </div>
        {err && <MessengerError err={err} closeError={() => setErr("")} />}
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
