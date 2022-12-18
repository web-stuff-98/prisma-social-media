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
exports.IconBtn = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const AuthContext_1 = require("../context/AuthContext");
const react_router_dom_1 = require("react-router-dom");
function IconBtn(_a) {
    var { Icon, isActive, color, children, onClick, redirectToLogin = false } = _a, props = __rest(_a, ["Icon", "isActive", "color", "children", "onClick", "redirectToLogin"]);
    const { user } = (0, AuthContext_1.useAuth)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    return ((0, jsx_runtime_1.jsxs)("button", Object.assign({ onClick: () => {
            if (redirectToLogin && !user)
                navigate("/login");
            if (onClick)
                onClick();
        }, className: `flex px-0 bg-transparent relative items-center ${isActive ? "icon-btn-active" : ""} ${color || ""}` }, props, { children: [(0, jsx_runtime_1.jsx)("span", Object.assign({ className: `${children != null ? "mr-0.5" : ""}` }, { children: (0, jsx_runtime_1.jsx)(Icon, { className: (color === null || color === void 0 ? void 0 : color.includes("text")) ? color : "" }) })), children] })));
}
exports.IconBtn = IconBtn;
