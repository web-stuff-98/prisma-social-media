import {
  useState,
  useContext,
  createContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type { ReactNode, ChangeEvent, FormEvent } from "react";
import { MdError, MdSend } from "react-icons/md";
import { BsFillChatRightFill } from "react-icons/bs";
import { AiFillPlusSquare } from "react-icons/ai";
import { CgProfile } from "react-icons/cg";
import { ImBlocked } from "react-icons/im";
import { sendPrivateMessage } from "../services/chat";
import useScrollbarSize from "react-scrollbar-size";

const UserdropdownContext = createContext<{
  clickPos: { left: string; top: string };
  openUserdropdown: (uid: string) => void;
}>({
  clickPos: { left: "0", top: "0" },
  openUserdropdown: () => {},
});

type MenuSection = "Menu" | "DirectMessage";

export function UserdropdownProvider({ children }: { children: ReactNode }) {
  const { width: scrollbarWidth } = useScrollbarSize();

  const containerRef = useRef<HTMLDivElement>(null);
  const [uid, setUid] = useState("");
  const [clickPos, setClickPos] = useState({ left: "0", top: "0" });
  const [cursorInside, setCursorInside] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [err, setErr] = useState("");
  const [section, setSection] = useState<MenuSection>("Menu");

  const openUserdropdown = (uid: string) => {
    setUid(uid);
  };

  const directMessageSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendPrivateMessage(messageInput, uid, false)
      .then(() => closeUserDropdown())
      .catch((e) => setErr(`${e}`));
  };

  const closeUserDropdown = () => {
    setUid("");
    setCursorInside(false);
    setSection("Menu");
    setErr("");
  };

  const adjust = useCallback(
    (delay?: boolean) => {
      if (delay) setTimeout(() => internal());
      else internal();
      function internal() {
        if (!containerRef.current) throw new Error("NO CONTAINER REF!!!");
        const leftClickPos = Number(clickPos.left.replace("px", ""));
        const containerRightEndPos =
          leftClickPos + containerRef.current?.clientWidth;
        const padPx = 3 + scrollbarWidth;
        if (containerRightEndPos + padPx > window.innerWidth) {
          setClickPos({
            left: `${
              leftClickPos -
              Math.abs(window.innerWidth - containerRightEndPos - padPx)
            }px`,
            top: clickPos.top,
          });
        }
      }
    },
    [clickPos]
  );
  useEffect(() => {
    if (containerRef.current) adjust();
  }, [uid]);

  const clickedWhileOutside = useCallback((e: MouseEvent) => {
    closeUserDropdown();
    setClickPos({
      left: `${e.clientX}px`,
      top: `${e.clientY}px`,
    });
  }, []);

  useEffect(() => {
    if (uid) adjust(true);
  }, [section]);

  useEffect(() => {
    if (!cursorInside)
      window.addEventListener("mousedown", clickedWhileOutside);
    else window.removeEventListener("mousedown", clickedWhileOutside);
    return () => window.removeEventListener("mousedown", clickedWhileOutside);
  }, [cursorInside]);

  const inviteUser = () => {};
  const blockUser = () => {};

  return (
    <UserdropdownContext.Provider value={{ clickPos, openUserdropdown }}>
      {uid && (
        <div
          ref={containerRef}
          onMouseEnter={() => setCursorInside(true)}
          onMouseLeave={() => setCursorInside(false)}
          aria-label="User dropdown"
          style={{ left: clickPos.left, top: clickPos.top, zIndex: 100 }}
          className="bg-foreground text-white dark:bg-darkmodeForeground fixed border dark:border-stone-800 rounded shadow-md p-1"
        >
          {err ? (
            <div className="text-rose-500 flex items-center gap-1 text-xs pr-0.5 drop-shadow">
              <MdError className="text-xl" />
              {err}
            </div>
          ) : (
            <>
              {section === "Menu" && (
                <div className="flex flex-col gap-1">
                  <button
                    aria-label="Message"
                    className="text-xs rounded-sm px-0.5 pr-1 gap-2 font-bold flex items-center justify-between"
                    onClick={() => setSection("DirectMessage")}
                  >
                    <BsFillChatRightFill className="text-md" />
                    Chat
                  </button>
                  <button
                    className="text-xs rounded-sm px-0.5 pr-1 gap-2 font-bold flex items-center justify-between"
                    aria-label="Block"
                    onClick={() => blockUser()}
                  >
                    <CgProfile className="text-md" />
                    Profile
                  </button>
                  <button
                    className="text-xs rounded-sm px-0.5 pr-1 gap-2 font-bold flex items-center justify-between"
                    aria-label="Invite"
                    onClick={() => inviteUser()}
                  >
                    <AiFillPlusSquare className="text-md" />
                    Invite
                  </button>
                  <button
                    className="text-xs rounded-sm px-0.5 pr-1 gap-2 font-bold flex items-center justify-between"
                    aria-label="Block"
                    onClick={() => blockUser()}
                  >
                    <ImBlocked className="text-md" />
                    Block
                  </button>
                </div>
              )}
              {section === "DirectMessage" && (
                <form
                  className="flex items-center"
                  onSubmit={directMessageSubmit}
                >
                  <input
                    autoFocus
                    value={messageInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setMessageInput(e.target.value)
                    }
                    placeholder="Direct message..."
                    required
                    type="text"
                    className="text-black dark:text-white"
                  />
                  <button
                    aria-label="Send direct message"
                    className="bg-transparent px-0 pl-1 text-xl"
                  >
                    <MdSend className="text-black dark:text-white" />
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
      {children}
    </UserdropdownContext.Provider>
  );
}

export const useUserdropdown = () => useContext(UserdropdownContext);
