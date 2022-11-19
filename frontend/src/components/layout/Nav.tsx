import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import { CgDarkMode } from "react-icons/cg";
import { useInterface } from "../../context/InterfaceContext";
import { useEffect, useRef } from "react";

export default function Nav() {
  const containerRef = useRef<HTMLElement>(null);
  const { logout, user } = useAuth();

  const { state: iState, dispatch: iDispatch } = useInterface();

  useEffect(() => {
    if (!containerRef.current) return;
    if (iState.darkMode) {
      containerRef.current.classList.remove("border-t");
    } else {
      containerRef.current.classList.add("border-t");
    }
  }, [iState]);

  return (
    <nav
      ref={containerRef}
      className="w-full bg-neutral-900 dark:bg-zinc-900 border-t border-b border-zinc-800 dark:border-stone-800 dark:bg-zinc-900 min-h-nav"
    >
      <div className="mx-auto h-full container flex items-center justify-between px-1.5">
        <div className="flex text-white gap-5">
          <Link to="/" aria-label="Home" className="text-md font-bold">
            Home
          </Link>
          {user && (
            <Link
              to="/settings"
              aria-label="Settings"
              className="text-md font-bold"
            >
              Settings
            </Link>
          )}
          {!user && (
            <>
              <Link
                to="/login"
                aria-label="Login"
                className="text-md font-bold"
              >
                Login
              </Link>
              <Link
                to="/register"
                aria-label="Register"
                className="text-md font-bold"
              >
                Register
              </Link>
            </>
          )}
          {user && (
            <Link
              to="/editor"
              aria-label="Editor"
              className="text-md font-bold"
            >
              Editor
            </Link>
          )}

          {user && (
            <button
              className="text-md font-bold px-0 bg-transparent"
              onClick={() => logout()}
            >
              Logout
            </button>
          )}
        </div>
        <div
          onClick={() => iDispatch({ darkMode: !iState.darkMode })}
          className="text-white cursor-pointer flex items-center text-xs gap-1 font-extrabold uppercase"
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
    </nav>
  );
}
