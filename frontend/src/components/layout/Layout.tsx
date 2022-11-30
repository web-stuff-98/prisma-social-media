import { useEffect } from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import {
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useFilter } from "../../context/FilterContext";
import { useInterface } from "../../context/InterfaceContext";
import Header from "./Header";
import Nav from "./Nav";

export default function Layout() {
  const location = useLocation();
  const { state: iState } = useInterface();
  const { searchTags, autoAddRemoveSearchTag, maxPage, pageCount, fullCount } =
    useFilter();
  const navigate = useNavigate();
  const query = useParams();
  let [searchParams] = useSearchParams();

  useEffect(() => {
    if (iState.darkMode) document.body.classList.add("dark");
    else document.body.classList.remove("dark");
  }, [iState]);

  const prevPage = () => {
    const term = searchParams.get("term");
    const tags = searchParams.get("tags");
    const preserveQuery = `${term ? `?term=${term}` : ""}${
      tags ? `${term ? "&" : "?"}tags=${tags}` : ""
    }`;
    navigate(`/${Math.max(Number(query.page) - 1, 1)}${preserveQuery}`);
  };
  const nextPage = () => {
    const term = searchParams.get("term");
    const tags = searchParams.get("tags");
    const preserveQuery = `${term ? `?term=${term}` : ""}${
      tags ? `${term ? "&" : "?"}tags=${tags}` : ""
    }`;
    navigate(`/${Math.min(Number(query.page) + 1, maxPage)}${preserveQuery}`);
  };

  return (
    <div
      style={{
        backgroundImage: iState.darkMode
          ? "url(./bgt_dark.png)"
          : "url(./bgt.png)",
      }}
      className="w-screen font-rubik h-screen overflow-x-hidden text-black dark:text-white flex flex-col"
    >
      <div
        style={{ top: "0", zIndex: "99" }}
        className="sticky w-full shadow-md flex flex-col"
      >
        <Header />
        <Nav />
      </div>
      <main
        className={
          location.pathname.includes("/editor") ||
          location.pathname.includes("/posts")
            ? "container mx-auto mt-navheader w-full h-screen bg-foreground dark:bg-darkmodeForeground border-l border-r border-stone-200 shadow dark:border-stone-800 px-2"
            : location.pathname === "/login" ||
              location.pathname === "/register" ||
              location.pathname === "/settings"
            ? "w-fit rounded my-auto shadow-xl mx-auto bg-foreground dark:bg-darkmodeForeground border border-stone-300 dark:border-stone-800"
            : "container mx-auto mt-navheader w-full h-screen"
        }
      >
        <Outlet />
      </main>
      {true && (
        <div
          style={{ bottom: "0" }}
          className="fixed flex items-center justify-center bg-neutral-900 dark:bg-zinc-900 border-t border-black dark:border-zinc-800 w-screen min-h-footer"
        >
          <BsChevronLeft
            onClick={() => prevPage()}
            className="text-white cursor-pointer text-3xl"
          />
          <div className="flex text-white flex-col items-center justify-center">
            <div style={{ lineHeight: "1" }} className="text-2xl">
              {query.page}/{Math.ceil(fullCount / 20)}
            </div>
            <div style={{ lineHeight: "1" }}>
              {pageCount}/{fullCount}
            </div>
          </div>
          <BsChevronRight
            onClick={() => nextPage()}
            className="text-white cursor-pointer text-3xl"
          />
        </div>
      )}
    </div>
  );
}