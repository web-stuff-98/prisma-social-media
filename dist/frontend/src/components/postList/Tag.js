"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const FilterContext_1 = require("../../context/FilterContext");
function Tag({ tag, isSearchTag, }) {
    const { autoAddRemoveSearchTag, searchTags } = (0, FilterContext_1.useFilter)();
    return ((0, jsx_runtime_1.jsx)("span", Object.assign({ onClick: () => autoAddRemoveSearchTag(tag.trim()), style: searchTags.includes(tag) && !isSearchTag
            ? {
                filter: "opacity(0.625) saturate(0.666)",
            }
            : {}, className: "text-xs rounded cursor-pointer bg-gray-900 hover:bg-gray-800 text-white leading-4 hover:bg-gray-600 py-0.5 px-1 sm:py-0 dark:bg-amber-700 dark:hover:bg-amber-600 dark:border-zinc-200 dark:border border border-zinc-300" }, { children: tag })));
}
exports.default = Tag;
