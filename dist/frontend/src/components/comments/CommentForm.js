"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentForm = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const md_1 = require("react-icons/md");
const im_1 = require("react-icons/im");
const ErrorTip_1 = __importDefault(require("../ErrorTip"));
function CommentForm({ loading, error, onSubmit, autoFocus = false, initialValue = "", placeholder = "", onClickOutside = () => { }, }) {
    const [message, setMessage] = (0, react_1.useState)(initialValue);
    function handleSubmit(e) {
        e.preventDefault();
        onSubmit(message).then(() => setMessage(""));
    }
    const [mouseInside, setMouseInside] = (0, react_1.useState)(false);
    const onMouseEnter = () => setMouseInside(true);
    const onMouseLeave = () => setMouseInside(false);
    (0, react_1.useEffect)(() => {
        const clicked = () => {
            if (!mouseInside) {
                onClickOutside();
            }
        };
        document.addEventListener("mousedown", clicked);
        return () => {
            document.removeEventListener("mousedown", clicked);
        };
    }, [mouseInside]);
    return ((0, jsx_runtime_1.jsx)("form", Object.assign({ className: "w-full mb-2 h-6 my-auto flex", onSubmit: handleSubmit }, { children: (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "grow relative flex" }, { children: [(0, jsx_runtime_1.jsx)("input", { autoFocus: autoFocus, value: message, placeholder: placeholder, onChange: (e) => setMessage(e.target.value), className: "w-full", onMouseEnter: () => onMouseEnter(), onMouseLeave: () => onMouseLeave() }), (0, jsx_runtime_1.jsx)("button", Object.assign({ "aria-label": "Submit", className: "px-1", type: "submit", disabled: loading }, { children: loading ? ((0, jsx_runtime_1.jsx)(im_1.ImSpinner8, { className: "animate-spin" })) : ((0, jsx_runtime_1.jsx)(md_1.MdSend, { className: "text-2xl" })) })), error && (0, jsx_runtime_1.jsx)(ErrorTip_1.default, { message: String(error) })] })) })));
}
exports.CommentForm = CommentForm;
