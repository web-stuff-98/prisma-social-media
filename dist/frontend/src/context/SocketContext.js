"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSocket = exports.SocketProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const makeRequest_1 = require("../services/makeRequest");
const SocketContext = (0, react_1.createContext)({
    socket: undefined,
    authSocket: () => { },
});
const SocketProvider = ({ children }) => {
    const [socket, setSocket] = (0, react_1.useState)();
    const connectSocket = () => {
        const socket = (0, socket_io_client_1.default)(makeRequest_1.baseURL, {
            withCredentials: true,
        }).connect();
        setSocket(socket);
    };
    const authSocket = () => {
        if (socket)
            socket.disconnect();
        connectSocket();
    };
    (0, react_1.useEffect)(() => {
        connectSocket();
        return () => {
            socket === null || socket === void 0 ? void 0 : socket.disconnect();
        };
    }, []);
    return ((0, jsx_runtime_1.jsx)(SocketContext.Provider, Object.assign({ value: { socket, authSocket } }, { children: children })));
};
exports.SocketProvider = SocketProvider;
const useSocket = () => (0, react_1.useContext)(SocketContext);
exports.useSocket = useSocket;
