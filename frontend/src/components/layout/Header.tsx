import { CgDarkMode } from "react-icons/cg";
import { useFilter } from "../../context/FilterContext";
import { useInterface } from "../../context/InterfaceContext";

export default function Header() {
  const { state: iState, dispatch: iDispatch } = useInterface();
  const { status } = useFilter()

  return (
    <header
      style={{ textShadow: "1px 2px 4px black" }}
      className="min-h-header relative tracking-wide font-bold border-zinc-800 dark:border-zinc-800 bg-gradient-to-t from-indigo-800 to-indigo-900 dark:bg-zinc-900 text-white text-xs flex justify-center"
    >
      <div
        className={`container p-2 flex flex-col md:items-center sm:items-start ${
          iState.breakPoint === "sm" ? "justify-end" : "justify-center"
        } h-full`}
      >
        <div className="uppercase text-xl font-extrabold leading-3 mt-2 tracking-tighter">
          Prisma-social-media
        </div>
        Group video chat, blog & filesharing
      </div>
      <div className="container absolute p-2 w-full h-full flex items-start justify-end">
        <div
          onClick={() => iDispatch({ darkMode: !iState.darkMode })}
          className="text-white whitespace-nowrap cursor-pointer flex items-center text-xs gap-1 font-extrabold uppercase"
        >
          {iState.darkMode ? "Dark" : "Light"} mode
          <CgDarkMode
            style={{
              transition: "transform 250ms ease-in-out",
              transform: iState.darkMode ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
            className="text-xl"
          />
        </div>
      </div>
    </header>
  );
}
