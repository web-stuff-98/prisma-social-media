import {
  useContext,
  createContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DropdownItem } from "../components/Dropdown";

export const SortOrderOptions: DropdownItem[] = [
  { name: "Descending", node: "Desc" }, // high to low
  { name: "Ascending", node: "Asc" }, //low to high
];

export const SortModeOptions: DropdownItem[] = [
  { name: "Popularity", node: "Popular" },
  { name: "Created at", node: "Created" },
];

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
      sortOrderIndex: number;
      sortModeIndex: number;
      setSortOrder: (to: number) => void;
      setSortMode: (to: number) => void;
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
  const [sortOrderIndex, setSortOrderIndex] = useState(0);
  const [sortModeIndex, setSortModeIndex] = useState(0);

  let [searchParams] = useSearchParams();
  const navigate = useNavigate();

  //if value is an empty string, it removes the param from the url
  const addUpdateOrRemoveParamsAndNavigateToUrl = (
    name?: string,
    value?: string
  ) => {
    const rawTags =
      name === "tags" ? value : searchParams.get("tags")?.replaceAll(" ", "+");
    const rawTerm =
      name === "term" ? value : searchParams.get("term")?.replaceAll(" ", "+");
    const rawOrder = name === "order" ? value : searchParams.get("order");
    const rawMode = name === "mode" ? value : searchParams.get("mode");
    let outTags = rawTags ? `&tags=${rawTags}` : "";
    let outTerm = rawTerm ? `&term=${rawTerm}` : "";
    let outOrder = rawOrder ? `&order=${rawOrder}` : "";
    let outMode = rawMode ? `&mode=${rawMode}` : "";
    const outStr = `/blog/1${outTags}${outTerm}${outOrder}${outMode}`;
    navigate(`${outStr}`.replace("/blog/1&", "/blog/1?"));
  };

  useEffect(() => {
    if (searchParams.get("term"))
      setSearchTermState(searchParams!.get("term")!.replaceAll("+", " "));
    if (searchParams.get("tags")) {
      const g = searchParams!.get("tag")!;
      setSearchTags(g ? g.split("+").filter((t) => t) : []);
    }
    if (searchParams.get("order")) {
      const g = searchParams.get("order");
      if (g === "des") setSortOrderIndex(0);
      if (g === "asc") setSortOrderIndex(1);
    }
    if (searchParams.get("mode")) {
      const g = searchParams.get("mode");
      if (g === "popular") setSortModeIndex(0);
      if (g === "created") setSortModeIndex(1);
    }
  }, []);

  const setSearchTerm = (to: string, dontPush?: boolean) => {
    setSearchTermState(to);
    if (!dontPush)
      addUpdateOrRemoveParamsAndNavigateToUrl(
        "term",
        to
          .replace(/[^a-zA-Z0-9 ]/g, "")
          .replaceAll(" ", "+")
          .toLowerCase()
          .trim()
      );
  };

  const autoAddRemoveSearchTag = (tag: string) => {
    const rawTags = searchParams.get("tags");
    let tags: string[] = [];
    if (rawTags)
      tags = String(rawTags)
        .replaceAll(" ", "+")
        .toLowerCase()
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
    addUpdateOrRemoveParamsAndNavigateToUrl(
      "tags",
      tags
        .filter((t) => t)
        .map((t) => t.toLowerCase())
        .join("+")
    );
  };

  const setSortMode = (index: number) => {
    setSortModeIndex(index);
    addUpdateOrRemoveParamsAndNavigateToUrl(
      "mode",
      index === 0 ? "popular" : "created"
    );
  };
  const setSortOrder = (index: number) => {
    setSortOrderIndex(index);
    addUpdateOrRemoveParamsAndNavigateToUrl(
      "order",
      index === 0 ? "des" : "asc"
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
        sortModeIndex,
        sortOrderIndex,
        setSortOrder,
        setSortMode,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => useContext(FilterContext);
