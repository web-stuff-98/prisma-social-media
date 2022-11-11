import { MdSend } from "react-icons/md";
import { AiOutlineMenuFold } from "react-icons/ai";

import type { ChangeEvent, FormEvent } from "react";

export default function MessageForm({
  handleMessageInput,
  handleMessageSubmit,
  messageInput,
}: {
  messageInput: string;
  handleMessageInput: (e: ChangeEvent<HTMLInputElement>) => void;
  handleMessageSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={handleMessageSubmit}
      className="w-full border-t h-10 flex items-center justify-between"
    >
      <input
        onChange={handleMessageInput}
        value={messageInput}
        id="message"
        name="message"
        type="text"
        className="grow mx-1 rounded-sm border px-1"
      />
      <div className="flex my-auto items-center">
        <button className="px-1" type="submit" aria-label="Send message">
          <MdSend className="text-2xl" />
        </button>
        <button type="button" aria-label="Back">
          <AiOutlineMenuFold className="text-2xl" />
        </button>
      </div>
    </form>
  );
}
