"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
function Toggler(_a) {
    var { value, toggleValue = () => { }, label = "Label" } = _a, props = __rest(_a, ["value", "toggleValue", "label"]);
    return ((0, jsx_runtime_1.jsxs)("button", Object.assign({}, props, { onClick: () => toggleValue(), className: "px-1 text-sm text-normal flex flex-col w-8 items-center h-10 justify-center bg-transparent" }, { children: [label, (0, jsx_runtime_1.jsx)("span", Object.assign({ className: "w-full dark:bg-gray-600 bg-stone-900 relative h-1 rounded-full" }, { children: (0, jsx_runtime_1.jsx)("span", { style: { position: "absolute", left: value ? "calc(100% - 0.5rem)" : "-0.25rem", top: "-0.0675rem", transition: "left 100ms ease" }, className: "rounded-sm bg-white dark:bg-gray-300 shadow-md h-1.5 w-3 border border-black dark:border-white" }) }))] })));
}
exports.default = Toggler;
