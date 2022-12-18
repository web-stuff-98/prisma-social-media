import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useInterface } from "../../context/InterfaceContext";
import { useRef } from "react";
import type { ChangeEvent } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { ImSpinner8 } from "react-icons/im";
import { IoSearch } from "react-icons/io5";
import { IconBtn } from "../IconBtn";
import {
  SortModeOptions,
  SortOrderOptions,
  useFilter,
} from "../../context/FilterContext";
import { usePosts } from "../../context/PostsContext";
import Dropdown from "../Dropdown";

export default function Nav() {
  const containerRef = useRef<HTMLElement>(null);
  const { logout, user } = useAuth();
  const { state: iState, dispatch: iDispatch } = useInterface();
  const {
    searchTerm,
    setSearchTerm,
    sortOrderIndex,
    sortModeIndex,
    setSortMode,
    setSortOrder,
  } = useFilter();
  const { status } = usePosts();

  const renderBlogControls = () => {
    return (
      <div className="flex dark items-center gap-1">
        <div className="flex">
          <div style={{width:"3rem"}}>
          <Dropdown
            items={SortOrderOptions}
            index={sortOrderIndex}
            setIndex={(to: number) => setSortOrder(to)}
            noRightBorderRadius
            noRightBorder
          />
          </div>
          <Dropdown
            items={SortModeOptions}
            index={sortModeIndex}
            setIndex={(to: number) => setSortMode(to)}
            noLeftBorderRadius
            noLeftBorder
          />
        </div>
        <input
          value={searchTerm}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
          type="text"
          style={{ width: "7.5rem" }}
          className="px-1"
        />
        <IconBtn
          aria-label="Submit search query"
          Icon={status === "pending-search" ? ImSpinner8 : IoSearch}
          color={`${
            status === "pending-search" ? "animate-spin" : ""
          } text-xl text-white`}
        />
      </div>
    );
  };

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
                    height: "14pc",
                  }
                : {}),
            }
          : {}
      }
      className={`w-full bg-neutral-900 dark:bg-zinc-900 border-b border-t border-zinc-800 dark:border-stone-800 min-h-nav`}
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
                  ? "flex flex-col gap-1 pt-2"
                  : "flex gap-4 tracking-tighter"
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
          {iState.breakPoint === "sm" && (
            <div
              className={`flex ${
                iState.mobileMenuOpen ? "" : "my-auto"
              } w-full`}
            >
              <button
                onClick={() =>
                  iDispatch({ mobileMenuOpen: !iState.mobileMenuOpen })
                }
                aria-label="Toggle navigation menu"
                className="bg-transparent px-0 w-full flex items-center justify-start"
              >
                <GiHamburgerMenu className="text-white text-2xl my-auto h-full" />
              </button>
              {iState.breakPoint === "sm" && renderBlogControls()}
            </div>
          )}
          {iState.breakPoint !== "sm" && renderBlogControls()}
        </div>
      </>
    </nav>
  );
}
