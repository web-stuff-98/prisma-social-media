import { useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useChat } from "../../../../context/ChatContext";
import MessengerError from "../../MessengerError";
import Room from "../Room";

export default function UsersChatrooms() {
  const { rooms } = useChat();
  const { user } = useAuth();

  const [err, setErr] = useState("")

  return (
    <div className="w-full h-full">
      <div style={{maxHeight:"20rem"}} className="flex overflow-y-auto flex-col justify-start gap-1 p-1 w-full">
        {rooms && rooms
          .filter((room) => room.authorId === user?.id)
          .map((r) => (
            <Room setErr={setErr} key={r.id} room={r} />
          ))}
          {rooms
          .filter((room) => room.authorId === user?.id).length === 0 && <p className="text-center">You have no rooms</p>}
      </div>
      {err && <MessengerError err={err} closeError={() => setErr("")}/>}
    </div>
  );
}
