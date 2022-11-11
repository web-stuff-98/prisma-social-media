import { MdClose } from "react-icons/md";
import { useMessenger } from "../context/MessengerContext";

export default function MessengerTopIcons() {
  const { closeMessenger } = useMessenger();

  return (
    <div
      style={{
        top: "0",
        left: "0",
      }}
      className="w-full bg-stone-900 border-b h-6 flex justify-end items-center top left fixed"
    >
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
