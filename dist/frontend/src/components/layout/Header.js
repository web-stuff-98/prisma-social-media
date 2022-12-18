"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const cg_1 = require("react-icons/cg");
const FilterContext_1 = require("../../context/FilterContext");
const InterfaceContext_1 = require("../../context/InterfaceContext");
function Header() {
    const { state: iState, dispatch: iDispatch } = (0, InterfaceContext_1.useInterface)();
    const { status } = (0, FilterContext_1.useFilter)();
    return ((0, jsx_runtime_1.jsxs)("header", Object.assign({ style: { textShadow: "1px 2px 4px black" }, className: "min-h-header relative tracking-wide font-bold border-zinc-800 dark:border-zinc-800 bg-gradient-to-t from-indigo-800 to-indigo-900 dark:bg-zinc-900 text-white text-xs flex justify-center" }, { children: [(0, jsx_runtime_1.jsxs)("div", Object.assign({ className: `container p-2 flex flex-col md:items-center sm:items-start ${iState.breakPoint === "sm" ? "justify-end" : "justify-center"} h-full` }, { children: [(0, jsx_runtime_1.jsx)("div", Object.assign({ className: "uppercase text-xl font-extrabold leading-3 mt-2 tracking-tighter" }, { children: "Prisma-social-media" })), "Group video chat, blog & filesharing"] })), (0, jsx_runtime_1.jsx)("div", Object.assign({ className: "container absolute p-2 w-full h-full flex items-start justify-end" }, { children: (0, jsx_runtime_1.jsxs)("div", Object.assign({ onClick: () => iDispatch({ darkMode: !iState.darkMode }), className: "text-white whitespace-nowrap cursor-pointer flex items-center text-xs gap-1 font-extrabold uppercase" }, { children: [iState.darkMode ? "Dark" : "Light", " mode", (0, jsx_runtime_1.jsx)(cg_1.CgDarkMode, { style: {
                                transition: "transform 250ms ease-in-out",
                                transform: iState.darkMode ? "rotateY(180deg)" : "rotateY(0deg)",
                            }, className: "text-xl" })] })) }))] })));
}
exports.default = Header;
