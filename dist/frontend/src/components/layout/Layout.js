"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useScrollToTop = exports.useScrollY = exports.ScrollToTopContext = exports.ScrollYContext = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const bs_1 = require("react-icons/bs");
const react_router_dom_1 = require("react-router-dom");
const react_scrollbar_size_1 = __importDefault(require("react-scrollbar-size"));
const FilterContext_1 = require("../../context/FilterContext");
const InterfaceContext_1 = require("../../context/InterfaceContext");
const Header_1 = __importDefault(require("./Header"));
const Nav_1 = __importDefault(require("./Nav"));
exports.ScrollYContext = (0, react_1.createContext)({ scrollY: 0 });
exports.ScrollToTopContext = (0, react_1.createContext)(() => { });
const useScrollY = () => (0, react_1.useContext)(exports.ScrollYContext);
exports.useScrollY = useScrollY;
const useScrollToTop = () => (0, react_1.useContext)(exports.ScrollToTopContext);
exports.useScrollToTop = useScrollToTop;
function Layout() {
    const location = (0, react_router_dom_1.useLocation)();
    const { state: iState } = (0, InterfaceContext_1.useInterface)();
    const { maxPage, pageCount, fullCount } = (0, FilterContext_1.useFilter)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const query = (0, react_router_dom_1.useParams)();
    let [searchParams] = (0, react_router_dom_1.useSearchParams)();
    const { width } = (0, react_scrollbar_size_1.default)();
    (0, react_1.useEffect)(() => {
        if (iState.darkMode)
            document.body.classList.add("dark");
        else
            document.body.classList.remove("dark");
    }, [iState]);
    const prevPage = () => {
        const term = searchParams.get("term");
        const tags = searchParams.get("tags");
        const preserveQuery = `${term ? `?term=${term}` : ""}${tags ? `${term ? "&" : "?"}tags=${tags}` : ""}`;
        navigate(`/blog/${Math.max(Number(query.page) - 1, 1)}${preserveQuery}`);
    };
    const nextPage = () => {
        const term = searchParams.get("term");
        const tags = searchParams.get("tags");
        const preserveQuery = `${term ? `?term=${term}` : ""}${tags ? `${term ? "&" : "?"}tags=${tags}` : ""}`;
        navigate(`/blog/${Math.min(Number(query.page) + 1, maxPage)}${preserveQuery}`);
    };
    const [scrollY, setScrollY] = (0, react_1.useState)(0);
    const containerRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        var _a;
        if (!containerRef)
            return;
        const onScroll = (e) => {
            var _a;
            if (containerRef.current)
                setScrollY((_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.scrollTop);
        };
        (_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.addEventListener("scroll", onScroll);
        return () => { var _a; return (_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.removeEventListener("scroll", onScroll); };
    }, [containerRef]);
    const scrollToTop = () => { var _a; return (_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.scrollTo({ top: 0, behavior: "auto" }); };
    return ((0, jsx_runtime_1.jsx)("div", Object.assign({ style: {
            backgroundImage: iState.darkMode
                ? "url(/bgt_dark.png)"
                : "url(/bgt.png)",
            backgroundPositionY: `${Math.ceil(scrollY * -0.025)}px`,
        }, ref: containerRef, className: "w-screen font-rubik h-screen overflow-x-hidden text-black dark:text-white flex flex-col" }, { children: (0, jsx_runtime_1.jsx)(exports.ScrollYContext.Provider, Object.assign({ value: { scrollY } }, { children: (0, jsx_runtime_1.jsxs)(exports.ScrollToTopContext.Provider, Object.assign({ value: scrollToTop }, { children: [(0, jsx_runtime_1.jsxs)("div", Object.assign({ style: { top: "0", zIndex: "99" }, className: "sticky w-full shadow-md flex flex-col" }, { children: [(0, jsx_runtime_1.jsx)(Header_1.default, {}), (0, jsx_runtime_1.jsx)(Nav_1.default, {})] })), (0, jsx_runtime_1.jsx)("div", Object.assign({ className: location.pathname.includes("/editor") ||
                            location.pathname.includes("/posts")
                            ? "my-auto h-full flex flex-col"
                            : "my-auto" }, { children: (0, jsx_runtime_1.jsx)("main", Object.assign({ style: location.pathname === "/login" ||
                                location.pathname === "/register" ||
                                location.pathname === "/settings" ||
                                location.pathname.includes("/profile") ||
                                location.pathname === "/"
                                ? { marginTop: "0.75pc", marginBottom: "0.75pc" }
                                : {}, className: location.pathname.includes("/editor") ||
                                location.pathname.includes("/posts")
                                ? "container mx-auto mt-navheader w-full grow bg-foreground dark:bg-darkmodeForeground border-l border-r border-stone-200 shadow dark:border-stone-800"
                                : location.pathname === "/login" ||
                                    location.pathname === "/register" ||
                                    location.pathname === "/settings" ||
                                    location.pathname.includes("/profile") ||
                                    location.pathname === "/"
                                    ? "w-fit rounded my-auto shadow-xl mx-auto max-w-gap bg-foreground dark:bg-darkmodeForeground border border-stone-300 dark:border-stone-800"
                                    : "container mx-auto mt-navheader w-full h-screen" }, { children: (0, jsx_runtime_1.jsx)(react_router_dom_1.Outlet, {}) })) })), location.pathname.includes("/blog") && ((0, jsx_runtime_1.jsxs)("footer", Object.assign({ style: { bottom: "0", width: `calc(100vw - ${width}px)` }, className: "fixed flex items-center justify-center bg-neutral-900 dark:bg-zinc-900 border-t border-black dark:border-zinc-800 w-screen min-h-footer" }, { children: [(0, jsx_runtime_1.jsx)(bs_1.BsChevronLeft, { onClick: () => prevPage(), className: "text-white cursor-pointer text-3xl" }), (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "flex text-white flex-col items-center justify-center" }, { children: [(0, jsx_runtime_1.jsxs)("div", Object.assign({ style: { lineHeight: "1" }, className: "text-2xl" }, { children: [query.page, "/", Math.ceil(fullCount / 20)] })), (0, jsx_runtime_1.jsxs)("div", Object.assign({ style: { lineHeight: "1" } }, { children: [pageCount, "/", fullCount] }))] })), (0, jsx_runtime_1.jsx)(bs_1.BsChevronRight, { onClick: () => nextPage(), className: "text-white cursor-pointer text-3xl" })] })))] })) })) })));
}
exports.default = Layout;
