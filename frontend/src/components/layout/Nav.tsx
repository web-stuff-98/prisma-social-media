import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { CgDarkMode } from "react-icons/cg";
import { useInterface } from "../../context/InterfaceContext";
import { useRef, useState, useEffect, useCallback } from "react";
import { GiHamburgerMenu } from "react-icons/gi";

export default function Nav() {
  const containerRef = useRef<HTMLElement>(null);
  const { logout, user } = useAuth();
  const { state: iState, dispatch: iDispatch } = useInterface();

  /*
  fade in navmenu items after the height transition, if the nav
  menu items are immediately visible then the height transition
  doesn't work
  */
  const renderDarkModeToggle = () => (
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
  );

  return (
    <nav
      ref={containerRef}
      style={
        iState.breakPoint === "sm"
          ? {
              transition: "height 100ms ease",
              ...(iState.mobileMenuOpen
                ? {
                    flexDirection: "column",
                    height: "15.5pc",
                  }
                : {}),
            }
          : {}
      }
      className={`w-full bg-neutral-900 dark:bg-zinc-900 border-b border-t border-zinc-800 dark:border-stone-800 dark:bg-zinc-900 min-h-nav`}
    >
      <>
        <div
          className={`mx-auto h-full container ${
            iState.breakPoint === "sm"
              ? `flex flex-col text-left py-1 items-start `
              : "flex items-center my-auto"
          } justify-between px-1.5`}
        >
          {(iState.breakPoint !== "sm" || iState.mobileMenuOpen) && (
            <div
              className={`${
                iState.breakPoint === "sm"
                  ? "flex flex-col gap-2 pt-2"
                  : "flex gap-5"
              } text-white`}
            >
              <Link to="/" aria-label="Home" className="text-md font-bold">
                Home
              </Link>
              <Link
                to="/blog/1"
                aria-label="Blog"
                className="text-md font-bold"
              >
                Blog
              </Link>
              {user && (
                <>
                  <Link
                    to="/settings"
                    aria-label="Settings"
                    className="text-md font-bold"
                  >
                    Settings
                  </Link>
                  <Link
                    to={`/profile/${user.id}`}
                    aria-label="Profile"
                    className="text-md font-bold"
                  >
                    Profile
                  </Link>
                </>
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
                  className={`text-md ${
                    iState.breakPoint === "sm" && iState.mobileMenuOpen
                      ? "text-left"
                      : "text-center"
                  } font-bold px-0 bg-transparent`}
                  onClick={() => logout()}
                >
                  Logout
                </button>
              )}
            </div>
          )}
          {iState.breakPoint !== "sm" && renderDarkModeToggle()}
          {iState.breakPoint === "sm" && (
            <div className={`flex ${iState.mobileMenuOpen ? "" : "my-auto"} w-full`}>
              <button
                onClick={() =>
                  iDispatch({ mobileMenuOpen: !iState.mobileMenuOpen })
                }
                aria-label="Toggle navigation menu"
                className="bg-transparent px-0 w-full flex items-center justify-start"
              >
                <GiHamburgerMenu className="text-white text-2xl my-auto h-full" />
              </button>
              {renderDarkModeToggle()}
            </div>
          )}
        </div>
      </>
    </nav>
  );
}
