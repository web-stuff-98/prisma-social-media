"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
function ErrorTip({ message }) {
    return ((0, jsx_runtime_1.jsx)("div", Object.assign({ className: "bg-rose-700 rounded px-2 leading-5", style: { position: "absolute", left: "0.666rem", top: "1.33rem" } }, { children: message })));
}
exports.default = ErrorTip;
