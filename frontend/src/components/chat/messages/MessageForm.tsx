import { MdSend } from "react-icons/md";
import { AiFillFileAdd } from "react-icons/ai";

import { useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { RiWebcamFill } from "react-icons/ri";

export default function MessageForm({
  handleMessageInput,
  handleFileInput,
  handleMessageSubmit,
  handleVidChatIconClicked = () => {},
  file,
  messageInput,
}: {
  messageInput: string;
  handleMessageInput: (e: ChangeEvent<HTMLInputElement>) => void;
  handleFileInput: (e: ChangeEvent<HTMLInputElement>) => void;
  handleMessageSubmit: (e: FormEvent<HTMLFormElement>) => void;
  handleVidChatIconClicked?: () => void;
  file?: File;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <form
      onSubmit={handleMessageSubmit}
      className="w-full border-t dark:border-zinc-800 h-10 py-1 flex items-center justify-between"
    >
      <button
        type="button"
        className="px-0 pl-1"
        aria-label="Select attachment"
        onClick={() => fileInputRef.current?.click()}
      >
        <AiFillFileAdd className={`text-lg ${file ? "text-green-500" : ""}`} />
      </button>
      <input
        onChange={handleFileInput}
        id="file"
        name="file"
        ref={fileInputRef}
        type="file"
        className="hidden"
      />
      <input
        onChange={handleMessageInput}
        value={messageInput}
        id="message"
        name="message"
        type="text"
        className="grow mx-1 rounded-sm border dark:border-zinc-800 px-1"
      />
      <div className="flex my-auto items-center">
        <button className="px-1 pl-0" type="submit" aria-label="Send message">
          <MdSend className="text-2xl" />
        </button>
        <button onClick={() => handleVidChatIconClicked()} className="px-2" type="button" aria-label="Open video chat">
          <RiWebcamFill className="text-2xl"/>
        </button>
      </div>
    </form>
  );
}