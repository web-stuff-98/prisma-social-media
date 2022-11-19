import { MdClose, MdMenu } from "react-icons/md";
import { useMessenger } from "../context/MessengerContext";

export default function MessengerTopIcons() {
  const { closeMessenger, setMessengerSection, messengerSection } = useMessenger();

  return (
    <div
    style={{top:"0"}}
      className="w-full bg-zinc-800 border-b dark:border-zinc-800 h-6 flex justify-end items-center absolute"
    >
            <button
            disabled={messengerSection === "Menu"}
            style={messengerSection === "Menu" ? {filter:"opacity(0.166)"} : {}}
      className="px-0 bg-transparent"
        aria-label="Close messenger"
      >
      <MdMenu
        onClick={() => setMessengerSection("Menu")}
        className="text-white text-xl"
      />
      </button>
      <button
      className="px-0 bg-transparent"
        aria-label="Close messenger"
      >
      <MdClose
        onClick={() => closeMessenger()}
        className="text-white text-xl"
      />
      </button>
    </div>
  );
}
