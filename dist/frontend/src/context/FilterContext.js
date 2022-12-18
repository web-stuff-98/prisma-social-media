"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFilter = exports.FilterProvider = exports.SortModeOptions = exports.SortOrderOptions = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
exports.SortOrderOptions = [
    { name: "Descending", node: "Desc" },
    { name: "Ascending", node: "Asc" }, //low to high
];
exports.SortModeOptions = [
    { name: "Popularity", node: "Popular" },
    { name: "Created at", node: "Created" },
];
const FilterContext = (0, react_1.createContext)(undefined);
const FilterProvider = ({ children }) => {
    const [searchTags, setSearchTags] = (0, react_1.useState)([]);
    const [pageCount, setPageCount] = (0, react_1.useState)(0);
    const [fullCount, setFullCount] = (0, react_1.useState)(0);
    const [maxPage, setMaxPage] = (0, react_1.useState)(1);
    const [searchOpen, setSearchOpen] = (0, react_1.useState)(false);
    const [searchTerm, setSearchTermState] = (0, react_1.useState)("");
    const [sortOrderIndex, setSortOrderIndex] = (0, react_1.useState)(0);
    const [sortModeIndex, setSortModeIndex] = (0, react_1.useState)(0);
    let [searchParams] = (0, react_router_dom_1.useSearchParams)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    //if value is an empty string, it removes the param from the url
    const addUpdateOrRemoveParamsAndNavigateToUrl = (name, value) => {
        var _a, _b;
        const rawTags = name === "tags" ? value : (_a = searchParams.get("tags")) === null || _a === void 0 ? void 0 : _a.replaceAll(" ", "+");
        const rawTerm = name === "term" ? value : (_b = searchParams.get("term")) === null || _b === void 0 ? void 0 : _b.replaceAll(" ", "+");
        const rawOrder = name === "order" ? value : searchParams.get("order");
        const rawMode = name === "mode" ? value : searchParams.get("mode");
        let outTags = rawTags ? `&tags=${rawTags}` : "";
        let outTerm = rawTerm ? `&term=${rawTerm}` : "";
        let outOrder = rawOrder ? `&order=${rawOrder}` : "";
        let outMode = rawMode ? `&mode=${rawMode}` : "";
        const outStr = `/blog/1${outTags}${outTerm}${outOrder}${outMode}`;
        navigate(`${outStr}`.replace("/blog/1&", "/blog/1?"));
    };
    (0, react_1.useEffect)(() => {
        if (searchParams.get("term"))
            setSearchTermState(searchParams.get("term").replaceAll("+", " "));
        if (searchParams.get("tags")) {
            const g = searchParams.get("tag");
            setSearchTags(g ? g.split("+").filter((t) => t) : []);
        }
        if (searchParams.get("order")) {
            const g = searchParams.get("order");
            if (g === "des")
                setSortOrderIndex(0);
            if (g === "asc")
                setSortOrderIndex(1);
        }
        if (searchParams.get("mode")) {
            const g = searchParams.get("mode");
            if (g === "popular")
                setSortModeIndex(0);
            if (g === "created")
                setSortModeIndex(1);
        }
    }, []);
    const setSearchTerm = (to, dontPush) => {
        setSearchTermState(to);
        if (!dontPush)
            addUpdateOrRemoveParamsAndNavigateToUrl("term", to
                .replace(/[^a-zA-Z0-9 ]/g, "")
                .replaceAll(" ", "+")
                .toLowerCase()
                .trim());
    };
    const autoAddRemoveSearchTag = (tag) => {
        const rawTags = searchParams.get("tags");
        let tags = [];
        if (rawTags)
            tags = String(rawTags)
                .replaceAll(" ", "+")
                .toLowerCase()
                .split("+")
                .filter((tag) => tag.trim() !== "");
        if (tags.includes(tag.toLowerCase())) {
            tags = tags.filter((t) => t !== tag.toLowerCase());
        }
        else {
            tags = [...tags, tag.toLowerCase()];
        }
        //sort tags alphabetically so that redundant query-props key value pairs for tags are not stored on redis
        //not sure how localeCompare is used to sort alphabetically since i copied it from stack overflow
        tags = tags.sort((a, b) => a.localeCompare(b));
        setSearchTags(tags);
        addUpdateOrRemoveParamsAndNavigateToUrl("tags", tags
            .filter((t) => t)
            .map((t) => t.toLowerCase())
            .join("+"));
    };
    const setSortMode = (index) => {
        setSortModeIndex(index);
        addUpdateOrRemoveParamsAndNavigateToUrl("mode", index === 0 ? "popular" : "created");
    };
    const setSortOrder = (index) => {
        setSortOrderIndex(index);
        addUpdateOrRemoveParamsAndNavigateToUrl("order", index === 0 ? "des" : "asc");
    };
    return ((0, jsx_runtime_1.jsx)(FilterContext.Provider, Object.assign({ value: {
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
        } }, { children: children })));
};
exports.FilterProvider = FilterProvider;
const useFilter = () => (0, react_1.useContext)(FilterContext);
exports.useFilter = useFilter;
