import { MdClose, MdError } from "react-icons/md";
export default function MessengerError({
  err = "",
  closeError,
}: {
  err: string;
  closeError: Function;
}) {
  return (
    <div className="w-full p-2 flex text-rose-600 bg-foreground text-md bg-black border-t dark:border-stone-800 items-center justify-between">
      <div className="flex items-center justify-center gap-2">
        <MdError className="text-2xl" />
        {err}
      </div>
      <button
        onClick={() => closeError()}
        aria-label="Close error message"
        className="bg-transparent px-0"
      >
        <MdClose className="text-white text-lg" />
      </button>
    </div>
  );
}
