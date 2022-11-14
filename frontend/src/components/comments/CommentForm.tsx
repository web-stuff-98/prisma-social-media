import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { MdSend } from "react-icons/md";
import { ImSpinner8 } from "react-icons/im";
import ErrorTip from "../ErrorTip";

export function CommentForm({
  loading,
  error,
  onSubmit,
  autoFocus = false,
  initialValue = "",
  placeholder = "",
  onClickOutside = () => {},
}: {
  loading: boolean;
  error: string | undefined;
  onSubmit: Function;
  autoFocus?: boolean;
  initialValue?: string;
  placeholder?: string;
  onClickOutside?: Function;
}) {
  const [message, setMessage] = useState(initialValue);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit(message).then(() => setMessage(""));
  }

  const [mouseInside, setMouseInside] = useState(false)

  const onMouseEnter = () => setMouseInside(true)
  const onMouseLeave = () => setMouseInside(false)

  useEffect(() => {
    const clicked = () => {
      if(!mouseInside) {
        onClickOutside()
      }
    }
    document.addEventListener("mousedown", clicked)
    return () => {
      document.removeEventListener("mousedown", clicked)
    }
  }, [mouseInside])

  return (
    <form className="w-full mb-2 h-6 my-auto flex" onSubmit={handleSubmit}>
      <div className="grow relative flex">
        <input
          autoFocus={autoFocus}
          value={message}
          placeholder={placeholder}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full"
          onMouseEnter={() => onMouseEnter()}
          onMouseLeave={() => onMouseLeave()}
        />
        <button
          aria-label="Submit"
          className="px-1"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <ImSpinner8 className="animate-spin" />
          ) : (
            <MdSend className="text-2xl" />
          )}
        </button>
        {error && <ErrorTip message={String(error)} />}
      </div>
    </form>
  );
}
