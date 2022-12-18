"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const Layout_1 = __importDefault(require("./components/layout/Layout"));
const ChatContext_1 = require("./context/ChatContext");
const InterfaceContext_1 = require("./context/InterfaceContext");
const ModalContext_1 = require("./context/ModalContext");
const AuthContext_1 = require("./context/AuthContext");
const SocketContext_1 = require("./context/SocketContext");
const UsersContext_1 = require("./context/UsersContext");
const UserdropdownContext_1 = require("./context/UserdropdownContext");
const PostsContext_1 = require("./context/PostsContext");
const FilterContext_1 = require("./context/FilterContext");
function App() {
    return ((0, jsx_runtime_1.jsx)(InterfaceContext_1.InterfaceProvider, { children: (0, jsx_runtime_1.jsx)(SocketContext_1.SocketProvider, { children: (0, jsx_runtime_1.jsx)(UsersContext_1.UsersProvider, { children: (0, jsx_runtime_1.jsx)(ModalContext_1.ModalProvider, { children: (0, jsx_runtime_1.jsx)(UserdropdownContext_1.UserdropdownProvider, { children: (0, jsx_runtime_1.jsx)(AuthContext_1.AuthProvider, { children: (0, jsx_runtime_1.jsx)(ChatContext_1.ChatProvider, { children: (0, jsx_runtime_1.jsx)(FilterContext_1.FilterProvider, { children: (0, jsx_runtime_1.jsx)(PostsContext_1.PostsProvider, { children: (0, jsx_runtime_1.jsx)(Layout_1.default, {}) }) }) }) }) }) }) }) }) }));
}
exports.default = App;
