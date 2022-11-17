import { MdSend, MdVideoCall, MdVideoCameraBack } from "react-icons/md";
import { AiOutlineMenuFold, AiFillFileAdd } from "react-icons/ai";

import { useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { BiWebcam } from "react-icons/bi";
import { RiWebcamFill } from "react-icons/ri";

export default function MessageForm({
  handleMessageInput,
  handleFileInput,
  handleMessageSubmit,
  file,
  messageInput,
}: {
  messageInput: string;
  handleMessageInput: (e: ChangeEvent<HTMLInputElement>) => void;
  handleFileInput: (e: ChangeEvent<HTMLInputElement>) => void;
  handleMessageSubmit: (e: FormEvent<HTMLFormElement>) => void;
  file?: File;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <form
      onSubmit={handleMessageSubmit}
      className="w-full border-t h-10 py-1 flex items-center justify-between"
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
        className="grow mx-1 rounded-sm border px-1"
      />
      <div className="flex my-auto items-center">
        <button className="px-1 pl-0" type="submit" aria-label="Send message">
          <MdSend className="text-2xl" />
        </button>
        <button className="px-2" type="button" aria-label="Send message">
          <RiWebcamFill className="text-2xl"/>
        </button>
      </div>
    </form>
  );
}
