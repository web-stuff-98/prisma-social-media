"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const md_1 = require("react-icons/md");
function MessengerError({ err = "", closeError, }) {
    return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ style: { background: "rgba(0,0,0,0.75)" }, className: "w-full p-1 flex text-rose-600 text-xs border-t dark:border-stone-800 items-center justify-between" }, { children: [(0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "flex drop-shadow items-center justify-center gap-2 leading-3 mb-0.5 tracking-tight" }, { children: [(0, jsx_runtime_1.jsx)(md_1.MdError, { style: { minWidth: "1.5rem", minHeight: "1.5rem" } }), err] })), (0, jsx_runtime_1.jsx)("button", Object.assign({ onClick: () => closeError(), "aria-label": "Close error message", className: "bg-transparent px-0" }, { children: (0, jsx_runtime_1.jsx)(md_1.MdClose, { className: "text-white text-lg" }) }))] })));
}
exports.default = MessengerError;
