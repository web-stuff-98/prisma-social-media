import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";

import { MdSend } from "react-icons/md";

export default function Rooms() {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
    } catch (e) {}
  };

  const [searchInput, setSearchInput] = useState("");

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="w-full h-10 border-t dark:border-zinc-800 flex items-center justify-between"
      >
        <input
          id="Search input"
          name="Search input"
          value={searchInput}
          className="grow mx-1 rounded-sm border dark:border-zinc-800 px-1"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearchInput(e.target.value)
          }
          aria-label="Search/Create room"
          type="text"
          placeholder="Search/Create room..."
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
    </>
  );
}
