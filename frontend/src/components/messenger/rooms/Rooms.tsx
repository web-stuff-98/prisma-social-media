import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";

import { MdSend } from "react-icons/md";

export default function Rooms() {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
    } catch (e) {}
  };

  const [input, setInput] = useState("");

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="w-full p-1 border-t dark:border-zinc-800 flex items-center justify-between"
      >
        <input
          id="Join/Create input"
          name="Join/Create input"
          value={input}
          className="grow rounded-sm border dark:border-zinc-800 px-1 mr-1"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setInput(e.target.value)
          }
          aria-label="Join/Create room"
          type="text"
          placeholder="Join/Create room..."
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
