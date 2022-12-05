import { useContext, createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const FilterContext = createContext<
  | {
      searchTags: string[];
      searchTerm: string;
      searchOpen: boolean;
      setSearchOpen: (to: boolean) => void;
      setSearchTerm: (to: string) => void;
      autoAddRemoveSearchTag: (tag: string) => void;
      pageCount: number;
      fullCount: number;
      maxPage: number;
      setPageCount: (to: number) => void;
      setFullCount: (to: number) => void;
      setMaxPage: (to: number) => void;
    }
  | any
>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [fullCount, setFullCount] = useState(0);
  const [maxPage, setMaxPage] = useState(1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTermState] = useState("");

  let [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get("term"))
      setSearchTermState(searchParams!.get("term")!.replaceAll("+", " "));
    if (searchParams.get("tags"))
      setSearchTags(
        searchParams!
          .get("tag")!
          .split("+")
          .filter((t) => t)
      );
  }, []);

  const setSearchTerm = (to: string, dontPush?: boolean) => {
    setSearchTermState(to);
    const rawTags = searchParams.get("tags");
    let tags: string[] = [];
    if (rawTags)
      tags = String(rawTags)
        .replaceAll(" ", "+")
        .split("+")
        .filter((tag: string) => tag.trim() !== "");
    if (to.trim() !== "") {
      setSearchTags(
        tags.length > 0
          ? tags
              .sort((a: string, b: string) => a.localeCompare(b))
              .filter((tag: string) => tag)
          : []
      );
      if (!dontPush)
        if (!tags)
          navigate(
            `/blog/1${to ? "?term=" : ""}${to.replaceAll(" ", "+").trim()}`
          );
        else
          navigate(
            `/blog/1?term=${to.replaceAll(" ", "+").trim()}&tags=${tags
              .sort((a: string, b: string) => a.localeCompare(b))
              .join("+")}`
          );
    } else if (!dontPush) {
      navigate(
        `/blog/1${to !== "" || tags.length > 0 ? "?" : ""}${
          to !== "" ? "term=" : ""
        }${to?.replaceAll(" ", "+")}${
          !to && tags.length > 0
            ? `?tags=${tags
                .sort((a: string, b: string) => a.localeCompare(b))
                .join("+")}`
            : tags.length > 0 && to
            ? `&tags=${tags
                .sort((a: string, b: string) => a.localeCompare(b))
                .join("+")}`
            : ""
        }`
      );
    }
  };

  const autoAddRemoveSearchTag = (tag: string) => {
    const rawTags = searchParams.get("tags");
    const term = searchParams.get("term");
    let tags: string[] = [];
    if (rawTags)
      tags = String(rawTags)
        .replaceAll(" ", "+")
        .split("+")
        .filter((tag: string) => tag.trim() !== "");
    if (tags.includes(tag.toLowerCase())) {
      tags = tags.filter((t: string) => t !== tag.toLowerCase());
    } else {
      tags = [...tags, tag.toLowerCase()];
    }
    //sort tags alphabetically so that redundant query-props key value pairs for tags are not stored on redis
    //not sure how localeCompare is used to sort alphabetically since i copied it from stack overflow
    tags = tags.sort((a: string, b: string) => a.localeCompare(b));
    setSearchTags(tags);
    navigate(
      `/blog/1${
        term && term.length > 0 ? `?term=` + term.replaceAll(" ", "+") : ""
      }${tags ? `${!term ? "?" : "&"}tags=${tags?.join("+")}` : ""}`
    );
  };

  return (
    <FilterContext.Provider
      value={{
        searchTags,
        autoAddRemoveSearchTag,
        setFullCount,
        fullCount,
        setPageCount,
        pageCount,
        maxPage,
        setMaxPage,
        searchTerm,
        setSearchTerm,
        searchOpen,
        setSearchOpen,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => useContext(FilterContext);
