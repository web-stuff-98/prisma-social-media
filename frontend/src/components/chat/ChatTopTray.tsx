import { MdClose, MdMenu } from "react-icons/md";
import { useChat } from "../../context/ChatContext";

export default function ChatTopIcons() {
  const { closeChat, setChatSection, chatSection, topText } = useChat();

  return (
    <div
      style={{ top: "0" }}
      className="w-full bg-zinc-800 dark:bg-zinc-900 border-b border-stone-800 text-white pl-1 text-xs dark:border-stone-800 h-6 flex justify-between items-center absolute"
    >
      {topText}
      <div className="grow flex justify-end">
        <button
          disabled={chatSection === "Menu"}
          style={chatSection === "Menu" ? { filter: "opacity(0.166)" } : {}}
          className="px-0 bg-transparent"
          aria-label="Close chat"
        >
          <MdMenu
            onClick={() => setChatSection("Menu")}
            className="text-white text-xl"
          />
        </button>
        <button className="px-0 bg-transparent" aria-label="Close chat">
          <MdClose onClick={() => closeChat()} className="text-white text-xl" />
        </button>
      </div>
    </div>
  );
}
