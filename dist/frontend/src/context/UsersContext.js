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
exports.UsersProvider = exports.UsersContext = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const AuthContext_1 = require("./AuthContext");
const users_1 = require("../services/users");
const SocketContext_1 = require("./SocketContext");
exports.UsersContext = (0, react_1.createContext)({
    users: [],
    cacheUserData: () => { },
    getUserData: () => undefined,
    visibleUsers: [],
    disappearedUsers: [],
    userEnteredView: () => { },
    userLeftView: () => { },
});
const UsersProvider = ({ children }) => {
    const { socket } = (0, SocketContext_1.useSocket)();
    const { user } = (0, AuthContext_1.useAuth)();
    const [users, setUsers] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        if (!socket)
            return;
        socket.on("user_visible_update", (data) => {
            setUsers((p) => {
                let newUsers = p;
                const i = p.findIndex((u) => u.id === data.id);
                newUsers[i] = Object.assign(Object.assign({}, newUsers[i]), data);
                return [...newUsers];
            });
        });
        return () => {
            socket.off("user_visible_update");
        };
    }, [socket]);
    const cacheUserData = (uid, force) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const found = users.find((u) => u.id === uid);
            if (found && !force)
                return;
            let u = yield (0, users_1.getUser)(uid);
            if (user && uid === (user === null || user === void 0 ? void 0 : user.id))
                u.online = true;
            setUsers((p) => [...p, u]);
        }
        catch (e) {
            console.warn("Could not cache data for user : " + uid);
        }
    });
    const getUserData = (0, react_1.useCallback)((uid) => users.find((u) => u.id === uid), [users]);
    const [visibleUsers, setVisibleUsers] = (0, react_1.useState)([]);
    const [disappearedUsers, setDisappearedUsers] = (0, react_1.useState)([]);
    const userEnteredView = (uid) => {
        setVisibleUsers((p) => [...p, uid]);
        setDisappearedUsers((p) => [...p.filter((u) => u.uid !== uid)]);
        subscribeToUser(uid);
    };
    const userLeftView = (uid) => {
        const visibleCount = visibleUsers.filter((visibleUid) => visibleUid === uid).length - 1;
        if (visibleCount === 0) {
            setVisibleUsers((p) => [...p.filter((visibleUid) => visibleUid !== uid)]);
            setDisappearedUsers((p) => [
                ...p.filter((p) => p.uid !== uid),
                {
                    uid,
                    disappearedAt: new Date(),
                },
            ]);
        }
        else {
            setVisibleUsers((p) => {
                //instead of removing all matching UIDs, remove only one, because we need to retain the duplicates
                let newVisibleUsers = p;
                newVisibleUsers.splice(p.findIndex((vuid) => vuid === uid), 1);
                return [...newVisibleUsers];
            });
        }
    };
    (0, react_1.useEffect)(() => {
        const i = setInterval(() => {
            const usersDisappeared30SecondsAgo = disappearedUsers
                .filter((du) => new Date().getTime() - du.disappearedAt.getTime() > 30000)
                .map((du) => du.uid);
            setUsers((p) => [
                ...p.filter((u) => !usersDisappeared30SecondsAgo.includes(u.id)),
            ]);
            setDisappearedUsers((p) => [
                ...p.filter((u) => !usersDisappeared30SecondsAgo.includes(u.uid)),
            ]);
            usersDisappeared30SecondsAgo.forEach((uid) => unsubscribeFromUser(uid));
        }, 5000);
        return () => {
            clearInterval(i);
        };
    }, [disappearedUsers]);
    const subscribeToUser = (0, react_1.useCallback)((uid) => {
        if (!socket)
            throw new Error("no socket");
        socket === null || socket === void 0 ? void 0 : socket.emit("user_visible", uid);
    }, [socket]);
    const unsubscribeFromUser = (0, react_1.useCallback)((uid) => {
        if (!socket)
            throw new Error("no socket");
        socket === null || socket === void 0 ? void 0 : socket.emit("user_not_visible", uid);
    }, [socket]);
    return ((0, jsx_runtime_1.jsx)(exports.UsersContext.Provider, Object.assign({ value: {
            users,
            cacheUserData,
            getUserData,
            userEnteredView,
            userLeftView,
            visibleUsers,
            disappearedUsers,
        } }, { children: children })));
};
exports.UsersProvider = UsersProvider;
const useUsers = () => (0, react_1.useContext)(exports.UsersContext);
exports.default = useUsers;
