import { IRoom, useChat } from "../../../context/ChatContext";
import useUsers from "../../../context/UsersContext";
import User from "../../User";

import {
  banUserFromRoom,
  kickUserFromRoom,
  unbanUserFromRoom,
  updateRoom,
} from "../../../services/chat";
import { useState } from "react";
import MessengerError from "../MessengerError";
import Toggler from "../../Toggler";

export default function EditRoom({ room }: { room: IRoom }) {
  const { editRoomId } = useChat();
  const { getUserData } = useUsers();

  const [err, setErr] = useState("");

  

  return (
    <div className="w-full h-full p-2">
      {room ? (
        <>
          <h1 className="font-bold text-2xl p-1 leading-5 text-center">
            {room.name}
          </h1>
          <div className="mx-auto w-fit mb-4">
            <Toggler
              label={room.public ? "Public" : "Private"}
              value={room.public}
              toggleValue={() =>
                updateRoom(room.id, { public: !room.public }).catch((e) => setErr(`${e}`))
              }
              aria-label="Toggle public"
            />
          </div>
          <h2 className="text-center text-md font-bold">Members</h2>
          <div style={{maxHeight:"10pc"}} className="flex overflow-y-auto flex-col gap-2">
            {room.members.map(({ id: memberUid }) => (
              <div
                key={memberUid}
                className="flex pr-1 border border-stone-300 dark:border-stone-800 shadow p-1 rounded justify-between items-center"
              >
                <div className="w-fit">
                  <User uid={memberUid} user={getUserData(memberUid)} />
                </div>
                <div>
                  <button
                    onClick={() => {
                      kickUserFromRoom(editRoomId, memberUid).catch((e) =>
                        setErr(`${e}`)
                      );
                    }}
                    aria-label="Kick"
                    className="mr-1"
                  >
                    Kick
                  </button>
                  <button
                    onClick={() => {
                      banUserFromRoom(editRoomId, memberUid).catch((e) =>
                        setErr(`${e}`)
                      );
                    }}
                    aria-label="Ban"
                    className="mr-1"
                  >
                    Ban
                  </button>
                </div>
              </div>
            ))}
          </div>
          {room.banned.length > 0 && <>
          <h2 className="text-center text-md mt-2 font-bold">Banned users</h2>
          <div style={{maxHeight:"10pc"}} className="flex flex-col gap-2 overflow-y-auto">
            {room.banned.map(({ id: bannedUid }) => (
              <div
                key={bannedUid}
                className="flex pr-1 border border-stone-300 dark:border-stone-800 shadow p-1 rounded justify-between items-center"
              >
                <div className="w-fit">
                  <User uid={bannedUid} user={getUserData(bannedUid)} />
                </div>
                <button
                  onClick={() => {
                    unbanUserFromRoom(editRoomId, bannedUid).catch((e) =>
                      setErr(`${e}`)
                    );
                  }}
                  aria-label="Unban"
                  className="mr-1"
                >
                  Unban
                </button>
              </div>
            ))}
          </div>
          </>}
        </>
      ) : (
        <>Room does not exist</>
      )}
      {err && (
        <div className="rounded mt-2 overflow-hidden">
          <MessengerError err={err} closeError={() => setErr("")} />
        </div>
      )}
    </div>
  );
}
