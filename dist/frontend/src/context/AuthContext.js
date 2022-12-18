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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = exports.AuthProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ModalContext_1 = require("./ModalContext");
const makeRequest_1 = require("../services/makeRequest");
const SocketContext_1 = require("./SocketContext");
const AuthContext = (0, react_1.createContext)({
    login: () => { },
    logout: () => { },
    register: () => { },
    user: undefined,
});
const AuthProvider = ({ children }) => {
    const { openModal } = (0, ModalContext_1.useModal)();
    const { authSocket } = (0, SocketContext_1.useSocket)();
    const [user, setUser] = (0, react_1.useState)();
    const checkUser = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = yield (0, makeRequest_1.makeRequest)("/api/users/check", {
                method: "POST",
                withCredentials: true,
            });
            setUser(user);
        }
        catch (error) {
            console.warn(error);
        }
    });
    (0, react_1.useEffect)(() => {
        const checkUserInterval = setInterval(checkUser, 10000);
        checkUser();
        return () => clearInterval(checkUserInterval);
    }, []);
    const login = (username, password) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const checkedUser = yield (0, makeRequest_1.makeRequest)("/api/users/login", {
                method: "POST",
                url: "/api/users/login",
                data: { username, password },
                withCredentials: true,
            });
            if (authSocket)
                authSocket();
            setUser(checkedUser);
        }
        catch (e) {
            openModal("Message", {
                err: true,
                msg: `${e}`,
                pen: false,
            });
        }
    });
    const register = (username, password) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = yield (0, makeRequest_1.makeRequest)("/api/users/register", {
                method: "POST",
                data: { username, password },
                withCredentials: true,
            });
            if (authSocket)
                authSocket();
            setUser(user);
            openModal("Message", {
                msg: "Account created. Your account and everything related to it will be deleted automatically after 20 minutes, including your posts and all your messages.",
                err: false,
                pen: false,
            });
        }
        catch (e) {
            openModal("Message", {
                err: true,
                msg: `${e}`,
                pen: false,
            });
        }
    });
    const logout = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield (0, makeRequest_1.makeRequest)("/api/users/logout", {
                method: "POST",
                withCredentials: true
            });
            setUser(undefined);
        }
        catch (e) {
            openModal("Message", {
                err: true,
                msg: `${e}`,
                pen: false,
            });
        }
    });
    return ((0, jsx_runtime_1.jsx)(AuthContext.Provider, Object.assign({ value: { login, logout, register, user } }, { children: children })));
};
exports.AuthProvider = AuthProvider;
const useAuth = () => (0, react_1.useContext)(AuthContext);
exports.useAuth = useAuth;
