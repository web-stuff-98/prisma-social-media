"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
//https://www.robinwieruch.de/react-hook-scrollbar-width/
//I haven't actually tested to see if this hook actually works, I just copy pasted it from the link.
//It is not being used. It gets the scroll bar width but the problem is it gets
//it when there is no scrollbar aswell when I just want it to return 0
function useScrollbarWidth() {
    const didCompute = React.useRef(false);
    const widthRef = React.useRef(0);
    if (didCompute.current)
        return widthRef.current;
    // Creating invisible container
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll'; // forcing scrollbar to appear
    // @ts-ignore
    outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
    document.body.appendChild(outer);
    // Creating inner element and placing it in the container
    const inner = document.createElement('div');
    outer.appendChild(inner);
    // Calculating difference between container's full width and the child width
    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
    // Removing temporary elements from the DOM
    // @ts-ignore
    outer.parentNode.removeChild(outer);
    didCompute.current = true;
    widthRef.current = scrollbarWidth;
    return scrollbarWidth;
}
exports.default = useScrollbarWidth;
;
