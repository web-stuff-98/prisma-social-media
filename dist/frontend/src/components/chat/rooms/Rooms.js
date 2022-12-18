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
const chat_1 = require("../../../services/chat");
const md_1 = require("react-icons/md");
const im_1 = require("react-icons/im");
const ChatContext_1 = require("../../../context/ChatContext");
const MessengerError_1 = __importDefault(require("../MessengerError"));
const Room_1 = __importDefault(require("./Room"));
function Rooms() {
    const { rooms, roomsError, roomsStatus } = (0, ChatContext_1.useChat)();
    const [err, setErr] = (0, react_1.useState)("");
    const [nameInput, setNameInput] = (0, react_1.useState)("");
    const handleSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        try {
            setErr("");
            yield (0, chat_1.createRoom)(nameInput);
        }
        catch (e) {
            setErr(`${e}`);
        }
    });
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "flex flex-col items-center justify-start" }, { children: [roomsStatus === "pending" && ((0, jsx_runtime_1.jsx)(im_1.ImSpinner8, { className: "drop-shadow animate-spin text-2xl my-2" })), roomsStatus === "error" && ((0, jsx_runtime_1.jsx)("div", Object.assign({ className: "text-lg text-rose-600 drop-shadow text-center flex flex-col items-center justify-center" }, { children: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(md_1.MdError, { className: "text-2xl mt-2 mb-0" }), roomsError] }) }))), (0, jsx_runtime_1.jsx)("div", Object.assign({ style: { maxHeight: "20rem" }, className: "flex overflow-y-auto flex-col justify-start gap-1 p-1 w-full" }, { children: rooms.map((room) => ((0, jsx_runtime_1.jsx)(Room_1.default, { setErr: setErr, room: room }, room.id))) })), err && (0, jsx_runtime_1.jsx)(MessengerError_1.default, { err: err, closeError: () => setErr("") })] })), (0, jsx_runtime_1.jsxs)("form", Object.assign({ "aria-label": "Create room form", onSubmit: handleSubmit, className: "w-full p-1 border-t dark:border-stone-800 flex items-center justify-between" }, { children: [(0, jsx_runtime_1.jsx)("input", { id: "Create room name input", name: "Create room name input", value: nameInput, className: "grow rounded-sm border dark:border-stone-800 px-1 mr-1", onChange: (e) => setNameInput(e.target.value), "aria-label": "Create room", type: "text", placeholder: "Create room...", required: true }), (0, jsx_runtime_1.jsx)("button", Object.assign({ "aria-label": "Submit", type: "submit", className: "text-2xl bg-transparent px-0 pr-1" }, { children: (0, jsx_runtime_1.jsx)(md_1.MdSend, {}) }))] }))] }));
}
exports.default = Rooms;
