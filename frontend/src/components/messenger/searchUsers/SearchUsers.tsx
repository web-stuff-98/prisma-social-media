import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { ImSpinner8 } from "react-icons/im";
import { MdSend } from "react-icons/md";
import { searchUsers } from "../../../services/chat";
import User from "../../User";
import useUsers from "../../../context/UsersContext";

export default function SearchUsers() {
  const { cacheUserData, getUserData } = useUsers();

  const [resMsg, setResMsg] = useState({ msg: "", err: false, pen: false });

  const [searchInput, setSearchInput] = useState("");
  const [uids, setUids] = useState<string[]>([]);

  const handleSearchSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setResMsg({ msg: "", err: false, pen: false });
      const uids: string[] = await searchUsers(searchInput);
      setUids(uids);
      uids.forEach((uid) => cacheUserData(uid));
      setResMsg({
        msg: uids.length === 0 ? "No users found" : "",
        err: false,
        pen: false,
      });
    } catch (e) {
      setResMsg({ msg: "", err: true, pen: false });
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between">
      <div className="w-full h-full grow flex flex-col items-start p-2 gap-2 justify-start">
        {resMsg.pen ? (
          <ImSpinner8 className="text-3xl mx-auto my-auto drop-shadow animate-spin" />
        ) : (
          <>
            {uids.map((uid) => (
              <User uid={uid} user={getUserData(uid)} />
            ))}
          </>
        )}
      </div>
      <form
        onSubmit={handleSearchSubmit}
        className="w-full h-10 border-t flex items-center justify-between"
      >
        <input
          id="Search input"
          name="Search input"
          value={searchInput}
          className="grow mx-1 rounded-sm border px-1"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearchInput(e.target.value)
          }
          aria-label="Search users input"
          type="text"
          placeholder="Search for users..."
          required
        />
        <button
          aria-label="Submit search"
          type="submit"
          className="text-2xl bg-transparent px-0 pr-2"
        >
          <MdSend />
        </button>
      </form>
    </div>
  );
}
