"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterfaceProvider = exports.useInterface = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
/*
Make sure theres are the same as the breakpoints in the tailwind config
*/
const breakPoints = {
    sm: 512,
    md: 570,
    xl: 680,
};
const InterfaceContext = (0, react_1.createContext)({
    state: {
        breakPoint: "xl",
        darkMode: true,
        mobileMenuOpen: false,
    },
    dispatch: () => { },
});
const interfaceReducer = (state, action) => (Object.assign(Object.assign({}, state), action));
const initialState = {
    breakPoint: "xl",
    darkMode: false,
    mobileMenuOpen: false,
};
const InterfaceProvider = ({ children }) => {
    const [state, dispatch] = (0, react_1.useReducer)(interfaceReducer, initialState);
    (0, react_1.useEffect)(() => {
        const getBreakpoint = () => {
            const w = window.innerWidth;
            let breakPoint = "sm";
            if (w >= breakPoints.md)
                breakPoint = "md";
            if (w >= breakPoints.xl)
                breakPoint = "xl";
            dispatch({ breakPoint });
        };
        const i = setInterval(() => getBreakpoint(), 500);
        const handleDetectDarkmode = (event) => dispatch({ darkMode: (event === null || event === void 0 ? void 0 : event.matches) ? true : false });
        window
            .matchMedia("(prefers-color-scheme: dark)")
            .addEventListener("change", handleDetectDarkmode);
        window.addEventListener("resize", getBreakpoint);
        return () => {
            clearInterval(i);
            window
                .matchMedia("(prefers-color-scheme: dark)")
                .removeEventListener("change", handleDetectDarkmode);
            window.removeEventListener("resize", getBreakpoint);
        };
    }, []);
    return ((0, jsx_runtime_1.jsx)(InterfaceContext.Provider, Object.assign({ value: { state, dispatch } }, { children: children })));
};
exports.InterfaceProvider = InterfaceProvider;
const useInterface = () => (0, react_1.useContext)(InterfaceContext);
exports.useInterface = useInterface;
