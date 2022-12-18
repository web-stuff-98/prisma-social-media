"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
function useOnScreen(ref) {
    const [isIntersecting, setIntersecting] = (0, react_1.useState)(false);
    const observer = new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting));
    (0, react_1.useEffect)(() => {
        observer.observe(ref.current);
        return () => {
            observer.disconnect();
        };
    }, []);
    return isIntersecting;
}
exports.default = useOnScreen;
