"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function Dropdown({ items = [
    { name: "A", node: (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: "A" }) },
    { name: "B", node: (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: "B" }) },
    { name: "C", node: (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: "C" }) },
], index = 0, setIndex = () => { }, noRightBorderRadius, noLeftBorderRadius, noRightBorder, noLeftBorder, }) {
    const rootItemContainerRef = (0, react_1.useRef)(null);
    const [dropdownOpen, setDropdownOpen] = (0, react_1.useState)(false);
    const renderItem = (name, children, itemIndex, list) => {
        var _a, _b;
        const isStartItem = itemIndex === 0 || !dropdownOpen;
        const isMiddleItem = itemIndex > 0 && itemIndex < items.length - 1;
        const isEndItem = itemIndex === items.length - 1;
        return ((0, jsx_runtime_1.jsx)("button", Object.assign({ type: "button", style: list
                ? Object.assign({ position: "absolute", top: `${((_a = rootItemContainerRef.current) === null || _a === void 0 ? void 0 : _a.clientHeight) * itemIndex}px` }, (isMiddleItem
                    ? {
                        borderTop: "none",
                        borderBottom: "none",
                        borderRadius: "0",
                        height: `${((_b = rootItemContainerRef.current) === null || _b === void 0 ? void 0 : _b.clientHeight) + 2}px`,
                    }
                    : Object.assign({}, (isEndItem
                        ? {
                            borderTop: "none",
                            borderTopLeftRadius: "0",
                            borderTopRightRadius: "0",
                        }
                        : {})))) : Object.assign(Object.assign({}, (dropdownOpen && isStartItem
                ? {
                    borderBottom: "none",
                    borderBottomLeftRadius: "0",
                    borderBottomRightRadius: "0",
                }
                : {})), (isStartItem
                ? Object.assign(Object.assign(Object.assign(Object.assign({}, (noLeftBorderRadius
                    ? {
                        borderTopLeftRadius: "0",
                        borderBottomLeftRadius: "0",
                    }
                    : {})), (noRightBorderRadius
                    ? {
                        borderTopRightRadius: "0",
                        borderBottomRightRadius: "0",
                    }
                    : {})), (noLeftBorder
                    ? {
                        borderLeft: "none",
                    }
                    : {})), (noRightBorder
                    ? {
                        borderRight: "none",
                    }
                    : {})) : {})), onClick: () => {
                if (!dropdownOpen) {
                    setDropdownOpen(true);
                }
                else {
                    setIndex(itemIndex);
                    setDropdownOpen(false);
                }
            }, "aria-label": name, className: `w-full ${itemIndex === index && dropdownOpen
                ? "bg-foregroundHover dark:bg-darkmodeForegroundHover"
                : "bg-foreground dark:bg-darkmodeForeground"} hover:bg-foregroundHover dark:hover:bg-darkmodeForegroundHover text-center flex items-center justify-center font-normal border dark:border-stone-800 px-1 text-xs rounded py-1 dark:text-white` }, { children: children }), name));
    };
    return ((0, jsx_runtime_1.jsx)("div", Object.assign({ onMouseLeave: () => setDropdownOpen(false), className: "w-full" }, { children: (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "relative", ref: rootItemContainerRef }, { children: [renderItem(items[dropdownOpen ? 0 : index].name, items[dropdownOpen ? 0 : index].node, dropdownOpen ? 0 : index), dropdownOpen &&
                    items
                        .slice(1, items.length)
                        .map((item, index) => renderItem(item.name, item.node, index + 1, true))] })) })));
}
exports.default = Dropdown;
