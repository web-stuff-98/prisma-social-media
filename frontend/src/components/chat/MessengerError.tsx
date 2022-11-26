import { MdClose, MdError } from "react-icons/md";
export default function MessengerError({
  err = "",
  closeError,
}: {
  err: string;
  closeError: Function;
}) {
  return (
    <div style={{background:"rgba(0,0,0,0.75)"}} className="w-full p-2 flex text-rose-600 text-md border-t dark:border-stone-800 items-center justify-between">
      <div className="flex drop-shadow items-center justify-center gap-2 leading-4 tracking-tight">
        <MdError style={{minWidth:"1.5rem", minHeight:"1.5rem"}} className="text-2xl" />
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
