"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
//https://usehooks.com/useAsync/
const useAsync = (asyncFunction, immediate = true) => {
    const [status, setStatus] = (0, react_1.useState)("idle");
    const [value, setValue] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    const execute = (0, react_1.useCallback)(() => {
        setStatus("pending");
        setValue(null);
        setError(null);
        return asyncFunction()
            .then((response) => {
            setValue(response);
            setStatus("success");
        })
            .catch((error) => {
            setError(error);
            setStatus("error");
        });
    }, [asyncFunction]);
    (0, react_1.useEffect)(() => {
        if (immediate) {
            execute();
        }
    }, [execute, immediate]);
    return { execute, status, value, error };
};
exports.default = useAsync;
