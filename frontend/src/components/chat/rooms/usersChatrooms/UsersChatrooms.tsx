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
        {rooms
          .filter((room) => room.authorId === user?.id)
          .map((r) => (
            <Room setErr={setErr} key={r.id} room={r} />
          ))}
      </div>
      {err && <MessengerError err={err} closeError={() => setErr("")}/>}
    </div>
  );
}
