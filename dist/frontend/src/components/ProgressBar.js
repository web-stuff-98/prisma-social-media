"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
function ProgressBar({ percent }) {
    return ((0, jsx_runtime_1.jsx)("span", Object.assign({ style: {
            width: '100%',
            height: '4px',
            background: 'linear-gradient(to top, black 0%, rgb(24,24,24) 100%)',
            border: '1px solid black',
            borderRadius: '3px',
            display: 'flex',
        } }, { children: (0, jsx_runtime_1.jsx)("span", { style: {
                width: `${percent}%`,
                height: '100%',
                background: 'linear-gradient(to top, green 0%, lime 100%)',
            } }) })));
}
exports.default = ProgressBar;
