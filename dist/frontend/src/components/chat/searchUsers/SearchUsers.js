"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const im_1 = require("react-icons/im");
const md_1 = require("react-icons/md");
const chat_1 = require("../../../services/chat");
const User_1 = __importDefault(require("../../User"));
const UsersContext_1 = __importDefault(require("../../../context/UsersContext"));
function SearchUsers() {
    const { cacheUserData, getUserData } = (0, UsersContext_1.default)();
    const [resMsg, setResMsg] = (0, react_1.useState)({ msg: "", err: false, pen: false });
    const [searchInput, setSearchInput] = (0, react_1.useState)("");
    const [uids, setUids] = (0, react_1.useState)([]);
    const handleSearchSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        try {
            setResMsg({ msg: "", err: false, pen: false });
            const uids = yield (0, chat_1.searchUsers)(searchInput);
            setUids(uids);
            uids.forEach((uid) => cacheUserData(uid));
            setResMsg({
                msg: uids.length === 0 ? "No users found" : "",
                err: false,
                pen: false,
            });
        }
        catch (e) {
            setResMsg({ msg: "", err: true, pen: false });
        }
    });
    return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "w-full h-full flex flex-col items-center justify-between" }, { children: [(0, jsx_runtime_1.jsx)("div", Object.assign({ className: "w-full h-full grow flex flex-col items-start p-2 gap-2 justify-start" }, { children: resMsg.pen ? ((0, jsx_runtime_1.jsx)(im_1.ImSpinner8, { className: "text-3xl mx-auto my-auto drop-shadow animate-spin" })) : ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: uids.map((uid) => ((0, jsx_runtime_1.jsx)(User_1.default, { uid: uid, user: getUserData(uid) }))) })) })), (0, jsx_runtime_1.jsxs)("form", Object.assign({ onSubmit: handleSearchSubmit, className: "w-full p-1 border-t dark:border-stone-800 flex items-center justify-between" }, { children: [(0, jsx_runtime_1.jsx)("input", { id: "Search input", name: "Search input", value: searchInput, className: "grow rounded-sm border dark:border-stone-800 px-1", onChange: (e) => setSearchInput(e.target.value), "aria-label": "Search users input", type: "text", placeholder: "Search for users...", required: true }), (0, jsx_runtime_1.jsx)("button", Object.assign({ "aria-label": "Submit search", type: "submit", className: "text-2xl bg-transparent px-1" }, { children: (0, jsx_runtime_1.jsx)(md_1.MdSend, {}) }))] }))] })));
}
exports.default = SearchUsers;
